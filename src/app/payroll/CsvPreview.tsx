'use client';
import type { Recipient } from './types';
import { ADDRESS_RE } from './types';
import styles from './payroll.module.css';

interface Props {
  text: string;
  mode: 'uniform' | 'custom';
  onAdd: (recipients: Recipient[]) => void;
  onCancel: () => void;
}

function parsePreview(text: string, mode: 'uniform' | 'custom'): { valid: Recipient[]; invalid: string[] } {
  const lines = text.split('\n').filter(l => l.trim());
  const valid: Recipient[] = [];
  const invalid: string[] = [];

  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    const addr = parts[0];
    if (!ADDRESS_RE.test(addr)) {
      if (addr) invalid.push(addr);
      continue;
    }
    const amount = mode === 'custom' ? (parts[1] ?? '') : '';
    valid.push({ address: addr, amount });
  }

  return { valid, invalid };
}

export function CsvPreview({ text, mode, onAdd, onCancel }: Props) {
  const { valid, invalid } = parsePreview(text, mode);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1rem', marginTop: '0.75rem',
    }}>
      <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        Found <strong style={{ color: 'var(--success)' }}>{valid.length}</strong> valid address{valid.length !== 1 ? 'es' : ''}
        {invalid.length > 0 && (
          <> and <strong style={{ color: 'var(--danger)' }}>{invalid.length}</strong> invalid</>
        )}
      </p>

      {valid.length > 0 && (
        <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          {valid.map(r => (
            <div key={r.address} style={{ fontFamily: 'monospace', color: 'var(--text-muted)', padding: '0.15rem 0' }}>
              {r.address}{mode === 'custom' && r.amount ? ` — ${r.amount}` : ''}
            </div>
          ))}
        </div>
      )}

      {invalid.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>Skipped:</p>
          {invalid.map(addr => (
            <div key={addr} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {addr}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className={styles.addBtn} onClick={() => onAdd(valid)} disabled={valid.length === 0}>
          Add {valid.length} Recipient{valid.length !== 1 ? 's' : ''}
        </button>
        <button type="button" className={styles.backBtn} onClick={onCancel} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
