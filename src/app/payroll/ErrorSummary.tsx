'use client';
import styles from './payroll.module.css';

interface Props {
  errors: string[];
}

export function ErrorSummary({ errors }: Props) {
  if (errors.length === 0) return null;

  return (
    <div style={{
      background: 'var(--danger)', opacity: 0.1, border: '1px solid var(--danger)',
      borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem',
    }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '0.25rem' }}>
        Please fix {errors.length} issue{errors.length !== 1 ? 's' : ''}:
      </p>
      {errors.map((err, i) => (
        <p key={i} style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: '0.15rem 0' }}>
          {err}
        </p>
      ))}
    </div>
  );
}
