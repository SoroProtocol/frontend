'use client';
import type { PayrollState } from './types';
import styles from './payroll.module.css';

interface Props {
  state: PayrollState;
}

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

export function ReviewStep({ state }: Props) {
  const days = calcDays(state.startDate, state.stopDate);
  const totalEscrow = state.mode === 'uniform'
    ? state.recipients.length * Number(state.ratePerDay || 0) * days
    : state.recipients.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div>
      <div className={styles.reviewTotal}>
        <span>Total Escrow Cost</span>
        <span>{totalEscrow.toFixed(2)} {state.token === 'native' ? 'XLM' : 'USDC'}</span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {state.recipients.length} recipient{state.recipients.length !== 1 ? 's' : ''} · {days.toFixed(1)} days · {state.mode === 'uniform' ? 'Uniform' : 'Custom'} mode
      </p>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className={styles.reviewTable}>
          <thead>
            <tr>
              <th>Address</th>
              <th style={{ textAlign: 'right' }}>{state.mode === 'uniform' ? 'Rate/Day' : 'Amount'}</th>
              <th style={{ textAlign: 'right' }}>Escrow</th>
            </tr>
          </thead>
          <tbody>
            {state.recipients.map(r => {
              const escrow = state.mode === 'uniform'
                ? Number(state.ratePerDay || 0) * days
                : Number(r.amount || 0);
              return (
                <tr key={r.address}>
                  <td title={r.address}>{r.address.slice(0, 8)}…{r.address.slice(-4)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {state.mode === 'uniform' ? `${Number(state.ratePerDay || 0)}/day` : r.amount}
                  </td>
                  <td style={{ textAlign: 'right' }}>{escrow.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
