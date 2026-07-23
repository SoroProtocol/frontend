'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useWallet }  from '@/context/WalletContext';
import { useStreams }  from '@/hooks/useStreams';
import { StreamCard } from '@/components/molecules/StreamCard';
import {
  DEFAULT_QUERY,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TOKEN_OPTIONS,
  selectStreams,
  type SortField,
  type StatusFilter,
  type TokenFilter,
} from './streamFilters';
import styles         from './dashboard.module.css';

export default function Dashboard() {
  const { address, connect } = useWallet();
  const { streams, loading, error, refetch } = useStreams(address);

  const [query, setQuery] = useState(DEFAULT_QUERY);

  const visibleStreams = useMemo(
    () => selectStreams(streams, query),
    [streams, query],
  );

  if (!address) {
    return (
      <div className={styles.empty}>
        <p>Connect your wallet to view your streams.</p>
        <button className={styles.connectBtn} onClick={connect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  const toggleDirection = () =>
    setQuery(q => ({ ...q, sortDirection: q.sortDirection === 'asc' ? 'desc' : 'asc' }));

  const showControls = streams.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Streams</h1>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={refetch} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          <Link href="/create" className={styles.newBtn}>+ New Stream</Link>
        </div>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {showControls && (
        <div className={styles.controls} role="group" aria-label="Filter and sort streams">
          <label className={styles.control}>
            <span>Status</span>
            <select
              className={styles.select}
              value={query.status}
              onChange={e => setQuery(q => ({ ...q, status: e.target.value as StatusFilter }))}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.control}>
            <span>Token</span>
            <select
              className={styles.select}
              value={query.token}
              onChange={e => setQuery(q => ({ ...q, token: e.target.value as TokenFilter }))}
            >
              {TOKEN_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.control}>
            <span>Sort by</span>
            <select
              className={styles.select}
              value={query.sortField}
              onChange={e => setQuery(q => ({ ...q, sortField: e.target.value as SortField }))}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.directionBtn}
            onClick={toggleDirection}
            aria-label={`Sort direction: ${query.sortDirection === 'asc' ? 'ascending' : 'descending'}. Activate to toggle.`}
          >
            {query.sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      )}

      {loading && streams.length === 0 ? (
        <div className={styles.skeleton}>
          {[0,1,2].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : streams.length === 0 ? (
        <div className={styles.noStreams}>
          <p>No streams yet.</p>
          <Link href="/create" className={styles.newBtn}>Create your first stream →</Link>
        </div>
      ) : visibleStreams.length === 0 ? (
        <div className={styles.noMatches}>
          <p>No streams match your filters.</p>
          <button className={styles.clearBtn} onClick={() => setQuery(DEFAULT_QUERY)}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleStreams.map(s => (
            <StreamCard
              key={s.id}
              id={s.id}
              recipient={s.recipient}
              token={s.token}
              ratePerSecond={BigInt(s.ratePerSecond || '0')}
              startTime={s.startTime}
              stopTime={s.stopTime}
              withdrawn={BigInt(s.withdrawn || '0')}
              status={s.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
