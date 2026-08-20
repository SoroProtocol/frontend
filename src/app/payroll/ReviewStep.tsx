'use client';
import type { PayrollState } from './types';
import { calcEscrow, calcDurationDays, calcUniformPerRecipient } from '@/lib/payroll';
import styles from './payroll.module.css';

interface Props {
  state: PayrollState;
}

export function ReviewStep({ state }: Props) {
  const days = calcDurationDays(state.startDate, state.stopDate);
  const total = state.mode
    ? calcEscrow(state.mode, state.recipients, state.ratePerDay, state.startDate, state.stopDate)
    : 0;

  return (
    <div>
      <div className={styles.reviewTotal}>
        <span>Total Escrow Cost</span>
        <span>{total.toFixed(2)} {state.token === 'native' ? 'XLM' : 'USDC'}</span>
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
                ? calcUniformPerRecipient(state.ratePerDay, state.startDate, state.stopDate)
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
