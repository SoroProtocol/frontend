'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { getRpcClient, getNetworkConfig } from '@/lib/contracts/client';
import { STREAM_CONTRACT_ID } from '@/lib/contracts/constants';

// ── Types ──────────────────────────────────────────────────────────────────

export type StreamEventType =
  | 'StreamCreated'
  | 'Withdrawn'
  | 'Cancelled'
  | 'VestingCreated'
  | 'VestingClaimed'
  | 'VestingRevoked';

export interface StreamEvent {
  id:           string;
  type:         StreamEventType;
  /** Amount in stroops (raw from the event) */
  amount:       string;
  /** Sender address (from topic or value) */
  sender:       string;
  /** Recipient address (from topic or value) */
  recipient:    string;
  /** Ledger sequence where the event was emitted */
  ledger:       number;
  /** ISO timestamp of when the ledger closed */
  timestamp:    string;
  /** Transaction hash that emitted this event */
  txHash:       string;
}

export interface UseStreamEventsOptions {
  /** Wallet address to filter events for (shows events where this address is sender or recipient) */
  walletAddress?: string;
  /** Filter to specific event types */
  types?: StreamEventType[];
  /** Max events per page */
  limit?: number;
}

export interface UseStreamEventsReturn {
  events:      StreamEvent[];
  loading:     boolean;
  error:       string | null;
  hasMore:     boolean;
  loadMore:    () => void;
  refresh:     () => void;
  totalCount:  number;
}

// ── Event type symbol lookup ────────────────────────────────────────────────

const EVENT_TYPES: StreamEventType[] = [
  'StreamCreated',
  'Withdrawn',
  'Cancelled',
  'VestingCreated',
  'VestingClaimed',
  'VestingRevoked',
];

// Map symbol strings from contract events to our types
const SYMBOL_TO_TYPE: Record<string, StreamEventType> = {
  created:           'StreamCreated',
  withdrawn:         'Withdrawn',
  cancelled:         'Cancelled',
  vesting_created:   'VestingCreated',
  vesting_claimed:   'VestingClaimed',
  vesting_revoked:   'VestingRevoked',
};

function classifyEvent(topics: StellarSdk.xdr.ScVal[]): StreamEventType | null {
  if (!topics.length) return null;
  const first = topics[0];
  if (first.switch() === StellarSdk.xdr.ScValType.scvSymbol()) {
    const sym = first.sym().toString();
    return SYMBOL_TO_TYPE[sym] ?? null;
  }
  return null;
}

function scValToAddress(val: StellarSdk.xdr.ScVal): string {
  try {
    if (val.switch() === StellarSdk.xdr.ScValType.scvAddress()) {
      return StellarSdk.Address.fromScVal(val).toString();
    }
  } catch { /* ignore */ }
  return '';
}

function scValToBigInt(val: StellarSdk.xdr.ScVal): string {
  try {
    if (val.switch() === StellarSdk.xdr.ScValType.scvI128()) {
      return StellarSdk.scValToNative(val).toString();
    }
  } catch { /* ignore */ }
  return '0';
}

// ── Hook ───────────────────────────────────────────────────────────────────

const PAGE_SIZE_DEFAULT = 20;

export function useStreamEvents(
  opts: UseStreamEventsOptions = {},
): UseStreamEventsReturn {
  const { walletAddress, types, limit = PAGE_SIZE_DEFAULT } = opts;

  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const cursorRef = useRef<string | null>(null);
  const allEventsRef = useRef<StreamEvent[]>([]);

  // We need a "latest ledger" to define the initial range.  We fetch it once
  // on mount so the first page covers from the oldest retained ledger up to now.
  const latestLedgerRef = useRef<number | null>(null);

  const fetchPage = useCallback(async (cursor?: string) => {
    if (!STREAM_CONTRACT_ID) return;

    const rpc = getRpcClient();
    const config = getNetworkConfig();

    // Fetch latest ledger if we don't have one yet
    if (!latestLedgerRef.current) {
      try {
        const info = await rpc.getLatestLedger();
        latestLedgerRef.current = info.sequence;
      } catch {
        // If we can't get latest ledger, use a large range
        latestLedgerRef.current = 999_999_999;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const request: StellarSdk.rpc.Api.GetEventsRequest = cursor
        ? {
            filters: [{ type: 'contract', contractIds: [STREAM_CONTRACT_ID] }],
            cursor,
            limit,
          }
        : {
            filters: [{ type: 'contract', contractIds: [STREAM_CONTRACT_ID] }],
            startLedger: Math.max(1, latestLedgerRef.current - 100_000),
            limit,
          };

      const response = await rpc.getEvents(request);

      const parsed: StreamEvent[] = response.events
        .map((ev) => {
          const type = classifyEvent(ev.topic);
          if (!type) return null;

          // For StreamCreated: topic[1] = sender, topic[2] = recipient
          // For Withdrawn:    topic[1] = stream_id, value = amount
          // For Cancelled:    topic[1] = stream_id
          const sender = ev.topic.length > 1 ? scValToAddress(ev.topic[1]) : '';
          const recipient = ev.topic.length > 2 ? scValToAddress(ev.topic[2]) : '';
          const amount = ev.value ? scValToBigInt(ev.value) : '0';

          return {
            id: ev.id,
            type,
            amount,
            sender,
            recipient,
            ledger: ev.ledger,
            timestamp: ev.ledgerClosedAt,
            txHash: ev.txHash,
          };
        })
        .filter((e): e is StreamEvent => e !== null);

      // Filter by wallet address if provided
      const filtered = walletAddress
        ? parsed.filter(
            (e) =>
              e.sender === walletAddress || e.recipient === walletAddress,
          )
        : parsed;

      // Filter by event types if provided
      const typeFiltered = types?.length
        ? filtered.filter((e) => types.includes(e.type))
        : filtered;

      if (cursor) {
        // Append to existing events
        allEventsRef.current = [...allEventsRef.current, ...typeFiltered];
      } else {
        allEventsRef.current = typeFiltered;
      }

      setEvents(allEventsRef.current);
      setTotalCount(allEventsRef.current.length);
      cursorRef.current = response.cursor;
      setHasMore(response.events.length === limit);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to fetch events',
      );
    } finally {
      setLoading(false);
    }
  }, [walletAddress, types, limit]);

  // Initial fetch
  useEffect(() => {
    allEventsRef.current = [];
    cursorRef.current = null;
    latestLedgerRef.current = null;
    void fetchPage();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (cursorRef.current && !loading) {
      void fetchPage(cursorRef.current);
    }
  }, [fetchPage, loading]);

  const refresh = useCallback(() => {
    allEventsRef.current = [];
    cursorRef.current = null;
    latestLedgerRef.current = null;
    setHasMore(true);
    void fetchPage();
  }, [fetchPage]);

  return { events, loading, error, hasMore, loadMore, refresh, totalCount };
}
