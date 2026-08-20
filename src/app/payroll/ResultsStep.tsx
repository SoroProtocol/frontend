'use client';
import Link from 'next/link';
import type { RecipientResult } from './types';
import styles from './payroll.module.css';

interface Props {
  results: RecipientResult[];
}

export function ResultsStep({ results }: Props) {
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
        {successes} succeeded, {failures} failed
      </p>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {results.map(r => (
          <div key={r.address} className={`${styles.resultRow} ${r.success ? styles.resultSuccess : styles.resultFail}`}>
            <span className={styles.resultIcon}>{r.success ? '✓' : '✗'}</span>
            <span className={styles.resultAddr} title={r.address}>{r.address}</span>
            {r.txHash && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {r.txHash.slice(0, 8)}…
              </span>
            )}
            {r.error && <span className={styles.resultError}>{r.error}</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link href="/dashboard" className={styles.dashLink}>View Dashboard</Link>
      </div>
    </div>
  );
}
