'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet }   from '@/context/WalletContext';
import { useToast }    from '@/context/ToastContext';
import { vestingApi, type ApiVestingSchedule } from '@/services/api';
import { fmtStroops, vestPct } from '@/lib/vesting';
import styles from './vesting.module.css';

export default function Vesting() {
  const { address }   = useWallet();
  const toast         = useToast();
  const [schedules, setSchedules] = useState<ApiVestingSchedule[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setSchedules([]); return; }
    setLoading(true);
    vestingApi.list(address)
      .then(setSchedules)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load schedules'))
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <div className={styles.page}>
        <p className={styles.notConnected}>Connect your wallet to view vesting schedules.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vesting Schedules</h1>
        <Link href="/vesting/create" className={styles.newBtn}>+ New Schedule</Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading…</p>
      ) : schedules.length === 0 ? (
        <p className={styles.empty}>No vesting schedules found.</p>
      ) : (
        <div className={styles.list}>
          {schedules.map(s => {
            const pct = vestPct(s);
            return (
              <div key={s.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.schedId}>Schedule #{s.id}</span>
                  <span className={styles.badge}>{s.revoked ? 'Revoked' : 'Active'}</span>
                </div>

                {[
                  ['Beneficiary', `${s.beneficiary.slice(0,5)}...${s.beneficiary.slice(-4)}`],
                  ['Total',       `${fmtStroops(s.totalAmount)} XLM`],
                  ['Claimed',     `${fmtStroops(s.claimed)} XLM`],
                ].map(([k, v]) => (
                  <div key={k} className={styles.row}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}

                <div
                  className={styles.bar}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Vesting progress"
                >
                  <div className={styles.fill} style={{ width: `${pct}%` }} />
                </div>
                <p className={styles.pctLabel}>{pct}% vested</p>

                {!s.revoked && (
                  <button
                    className={styles.claimBtn}
                    onClick={() => toast.info('On-chain claim coming in the next release')}
                  >
                    Claim Vested Tokens
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
