'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getStreamBalance } from '@/lib/contracts/streams';

export interface StreamBalanceResult {
  /** Current withdrawable balance in stroops */
  balance: bigint;
  /** True while the on-chain RPC call is in flight */
  syncing: boolean;
  /** True if the current balance came from an on-chain read (vs client-side estimate) */
  isFromChain: boolean;
}

/**
 * Real-time stream balance hook.
 *
 * Immediately shows a client-side estimate (ratePerSecond * elapsed - withdrawn)
 * so the counter never freezes.  In the background it calls
 * `stream.balance_of(stream_id)` on-chain and swaps to the real value once
 * the RPC responds.  A periodic re-fetch keeps the balance accurate if the
 * stream is cancelled or parameters change off-screen.
 */
export function useStreamBalance(
  streamId: string,
  walletAddress: string,
  ratePerSecond: bigint,
  lastWithdrawn: bigint,
  startTime: number,
  stopTime: number,
  tick = 200,
  enabled = true,
) {
  const [balance, setBalance] = useState<bigint>(0n);
  const [syncing, setSyncing] = useState(false);
  const [isFromChain, setIsFromChain] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastChainBalanceRef = useRef<bigint | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Client-side estimate (immediate, runs every `tick` ms) ────────────────
  useEffect(() => {
    if (!mounted || !enabled) return;

    const compute = () => {
      const now = Math.floor(Date.now() / 1000);
      if (now <= startTime) { setBalance(0n); return; }
      const elapsed = BigInt(Math.min(now, stopTime) - startTime);
      const accrued = ratePerSecond * elapsed;
      const est = accrued > lastWithdrawn ? accrued - lastWithdrawn : 0n;
      // Only use client estimate if we don't have a chain value yet
      if (!isFromChain) {
        setBalance(est);
      }
    };

    compute();
    timerRef.current = setInterval(compute, tick);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mounted, enabled, ratePerSecond, lastWithdrawn, startTime, stopTime, tick, isFromChain]);

  // ── On-chain balance fetch ────────────────────────────────────────────────
  const fetchOnChain = useCallback(async () => {
    if (!streamId || !walletAddress || !enabled) return;
    setSyncing(true);
    try {
      const raw = await getStreamBalance(streamId, walletAddress);
      const chainBalance = BigInt(raw);
      lastChainBalanceRef.current = chainBalance;
      setBalance(chainBalance);
      setIsFromChain(true);
    } catch {
      // RPC failed — keep the client-side estimate visible
    } finally {
      setSyncing(false);
    }
  }, [streamId, walletAddress, enabled]);

  // Initial fetch + periodic refresh every 15 s
  useEffect(() => {
    if (!mounted || !enabled) return;
    fetchOnChain();
    const id = setInterval(fetchOnChain, 15_000);
    return () => clearInterval(id);
  }, [mounted, enabled, fetchOnChain]);

  return { balance, syncing, isFromChain };
}
