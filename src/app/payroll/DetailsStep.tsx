'use client';
import type { PayrollMode } from './types';
import styles from './payroll.module.css';

interface Props {
  mode: PayrollMode;
  token: string;
  ratePerDay: string;
  startDate: string;
  stopDate: string;
  errors: Partial<Record<string, string>>;
  onChange: (field: string, value: string) => void;
}

export function DetailsStep({ mode, token, ratePerDay, startDate, stopDate, errors, onChange }: Props) {
  return (
    <div className={styles.form}>
      <label className={styles.field}>
        <span>Token</span>
        <select className={styles.input} value={token} onChange={e => onChange('token', e.target.value)}>
          <option value="native">XLM (Native)</option>
          <option value="usdc">USDC</option>
        </select>
      </label>

      {mode === 'uniform' && (
        <label className={styles.field}>
          <span>Rate per day (for all recipients)</span>
          <input
            className={errors.ratePerDay ? styles.inputError : styles.input}
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 10"
            value={ratePerDay}
            onChange={e => onChange('ratePerDay', e.target.value)}
          />
          {errors.ratePerDay && <span className={styles.error}>{errors.ratePerDay}</span>}
        </label>
      )}

      <div className={styles.dateRow}>
        <label className={styles.field}>
          <span>Start Date</span>
          <input
            className={errors.startDate ? styles.inputError : styles.input}
            type="datetime-local"
            value={startDate}
            onChange={e => onChange('startDate', e.target.value)}
          />
          {errors.startDate && <span className={styles.error}>{errors.startDate}</span>}
        </label>
        <label className={styles.field}>
          <span>End Date</span>
          <input
            className={errors.stopDate ? styles.inputError : styles.input}
            type="datetime-local"
            value={stopDate}
            onChange={e => onChange('stopDate', e.target.value)}
          />
          {errors.stopDate && <span className={styles.error}>{errors.stopDate}</span>}
        </label>
      </div>
    </div>
  );
}
