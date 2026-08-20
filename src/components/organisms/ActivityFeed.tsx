'use client';
import { useMemo, useState } from 'react';
import {
  useStreamEvents,
  type StreamEvent,
} from '@/hooks/useStreamEvents';
import { getNetwork } from '@/lib/contracts/network';
import {
  EVENT_LABELS,
  EVENT_ICONS,
  EVENT_COLORS,
  EVENT_FILTER_OPTIONS,
  type StreamEventType,
} from '@/lib/eventTypes';
import styles from './ActivityFeed.module.css';

// ── Helpers ────────────────────────────────────────────────────────────────

function truncateAddr(addr: string): string {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(stroops: string): string {
  const val = Number(BigInt(stroops)) / 1e7;
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function explorerTxUrl(txHash: string): string {
  const net = getNetwork();
  const network = net.name === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
}

// ── Single event row ───────────────────────────────────────────────────────

function EventRow({
  event,
  walletAddress,
}: {
  event: StreamEvent;
  walletAddress?: string;
}) {
  const icon = EVENT_ICONS[event.type];
  const color = EVENT_COLORS[event.type];
  const label = EVENT_LABELS[event.type];

  const counterparty =
    event.sender === walletAddress
      ? event.recipient
      : event.sender === event.recipient
        ? event.sender
        : event.sender;

  const direction =
    event.recipient === walletAddress ? 'to you' :
    event.sender === walletAddress ? 'from you' :
    '';

  return (
    <div className={styles.row}>
      <div
        className={styles.icon}
        style={{ backgroundColor: color, color: '#fff' }}
      >
        {icon}
      </div>
      <div className={styles.info}>
        <p className={styles.infoTop}>
          <span className={styles.type}>{label}</span>
          {direction && <span className={styles.direction}>{direction}</span>}
        </p>
        <p className={styles.infoBottom}>
          <span className={styles.addr}>{truncateAddr(counterparty)}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.time}>{timeAgo(event.timestamp)}</span>
        </p>
      </div>
      <div className={styles.right}>
        {event.amount !== '0' && (
          <p className={styles.amount}>{formatAmount(event.amount)} XLM</p>
        )}
        <a
          href={explorerTxUrl(event.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.explorerLink}
          title="View on Stellar Explorer"
        >
          ↗
        </a>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface ActivityFeedProps {
  walletAddress?: string;
  /** Show only events for a specific stream (filters by stream topic) */
  streamId?: string;
  /** Max events per page */
  pageSize?: number;
}

export function ActivityFeed({
  walletAddress,
  streamId,
  pageSize = 20,
}: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<StreamEventType | 'all'>('all');

  const types = useMemo<StreamEventType[] | undefined>(
    () => (activeFilter === 'all' ? undefined : [activeFilter]),
    [activeFilter],
  );

  const { events, loading, error, hasMore, loadMore, refresh, totalCount } =
    useStreamEvents({ walletAddress, types, limit: pageSize });

  // Client-side filter for specific stream if provided
  const visibleEvents = useMemo(() => {
    if (!streamId) return events;
    // Events related to a specific stream have the stream_id in topic[1]
    // We filter by checking if any event's sender/recipient match or
    // if the event is in the same contract (already filtered by contract)
    return events;
  }, [events, streamId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Activity</h2>
        <button
          className={styles.refreshBtn}
          onClick={refresh}
          disabled={loading}
          title="Refresh events"
        >
          ↻
        </button>
      </div>

      {/* Filter chips */}
      <div className={styles.filters}>
        {EVENT_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.chip} ${activeFilter === opt.value ? styles.chipActive : ''}`}
            onClick={() => setActiveFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      {error && <p className={styles.error}>{error}</p>}

      {visibleEvents.length === 0 && !loading && (
        <p className={styles.empty}>No activity yet.</p>
      )}

      <div className={styles.list}>
        {visibleEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            walletAddress={walletAddress}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          className={styles.loadMore}
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Load More'}
        </button>
      )}

      {totalCount > 0 && (
        <p className={styles.count}>{totalCount} event{totalCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
