'use client';
import styles from './payroll.module.css';

interface Props {
  total: number;
  token: string;
  recipientCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export function ConfirmDialog({ total, token, recipientCount, onConfirm, onCancel, submitting }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '2rem', maxWidth: '400px',
        width: '90%', textAlign: 'center',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Confirm Batch Payment</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          You are about to send <strong style={{ color: 'var(--accent)' }}>{total.toFixed(2)} {token === 'native' ? 'XLM' : 'USDC'}</strong> to{' '}
          <strong>{recipientCount}</strong> recipient{recipientCount !== 1 ? 's' : ''}.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          This action cannot be undone. Please confirm in your Freighter wallet.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className={styles.backBtn} onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className={styles.submit} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
