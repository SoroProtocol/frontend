'use client';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useWallet } from '@/context/WalletContext';
import { vestingApi } from '@/services/api';
import styles from './create.module.css';

interface FormState {
  beneficiary: string;
  token:       string;
  totalAmount: string;
  startDate:   string;
  cliffDate:   string;
  endDate:     string;
}

const INITIAL: FormState = {
  beneficiary: '', token: 'native', totalAmount: '',
  startDate: '', cliffDate: '', endDate: '',
};

function toUnixSeconds(datetimeLocal: string): number {
  return Math.floor(new Date(datetimeLocal).getTime() / 1000);
}

export default function CreateVestingSchedule() {
  const { address } = useWallet();
  const [form,       setForm]       = useState<FormState>(INITIAL);
  const [errors,     setErrors]     = useState<Partial<FormState>>({});
  const [status,     setStatus]     = useState<'idle' | 'submitting' | 'done'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.beneficiary.match(/^G[A-Z2-7]{55}$/)) e.beneficiary = 'Invalid Stellar address';
    if (!form.totalAmount || Number(form.totalAmount) <= 0) e.totalAmount = 'Must be > 0';
    if (!form.startDate) e.startDate = 'Required';
    if (!form.cliffDate) e.cliffDate = 'Required';
    if (!form.endDate)   e.endDate   = 'Required';
    if (form.startDate && form.cliffDate && form.cliffDate < form.startDate)
      e.cliffDate = 'Must be on or after the start date';
    if (form.cliffDate && form.endDate && form.endDate <= form.cliffDate)
      e.endDate = 'Must be after the cliff date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setStatus('submitting');
    try {
      await vestingApi.create({
        beneficiary: form.beneficiary,
        token:       form.token,
        totalAmount: Math.round(Number(form.totalAmount) * 1e7),
        startTime:   toUnixSeconds(form.startDate),
        cliffTime:   toUnixSeconds(form.cliffDate),
        endTime:     toUnixSeconds(form.endDate),
      });
      setStatus('done');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create schedule');
      setStatus('idle');
    }
  }

  if (!address) {
    return (
      <div className={styles.gated}>
        <p>Connect your wallet to create a vesting schedule.</p>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className={styles.success}>
        <span className={styles.checkmark}>✓</span>
        <h2>Vesting schedule created!</h2>
        <Link href="/vesting" className={styles.dashLink}>View Schedules</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Vesting Schedule</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>

        <label className={styles.field}>
          <span>Beneficiary Address</span>
          <input
            className={errors.beneficiary ? styles.inputError : styles.input}
            placeholder="G..."
            value={form.beneficiary}
            onChange={e => setForm(f => ({ ...f, beneficiary: e.target.value }))}
            aria-describedby={errors.beneficiary ? 'beneficiary-error' : undefined}
          />
          {errors.beneficiary && <span id="beneficiary-error" className={styles.error}>{errors.beneficiary}</span>}
        </label>

        <label className={styles.field}>
          <span>Token</span>
          <select
            className={styles.input}
            value={form.token}
            onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
          >
            <option value="native">XLM (Native)</option>
            <option value="usdc">USDC</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Total Amount (XLM)</span>
          <input
            className={errors.totalAmount ? styles.inputError : styles.input}
            type="number" min="0" step="0.01"
            placeholder="e.g. 10000"
            value={form.totalAmount}
            onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
            aria-describedby={errors.totalAmount ? 'amount-error' : undefined}
          />
          {errors.totalAmount && <span id="amount-error" className={styles.error}>{errors.totalAmount}</span>}
        </label>

        <div className={styles.dateRow}>
          <label className={styles.field}>
            <span>Start Date</span>
            <input
              className={errors.startDate ? styles.inputError : styles.input}
              type="datetime-local"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              aria-describedby={errors.startDate ? 'start-error' : undefined}
            />
            {errors.startDate && <span id="start-error" className={styles.error}>{errors.startDate}</span>}
          </label>
          <label className={styles.field}>
            <span>Cliff Date</span>
            <input
              className={errors.cliffDate ? styles.inputError : styles.input}
              type="datetime-local"
              value={form.cliffDate}
              onChange={e => setForm(f => ({ ...f, cliffDate: e.target.value }))}
              aria-describedby={errors.cliffDate ? 'cliff-error' : undefined}
            />
            {errors.cliffDate && <span id="cliff-error" className={styles.error}>{errors.cliffDate}</span>}
          </label>
          <label className={styles.field}>
            <span>End Date</span>
            <input
              className={errors.endDate ? styles.inputError : styles.input}
              type="datetime-local"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              aria-describedby={errors.endDate ? 'end-error' : undefined}
            />
            {errors.endDate && <span id="end-error" className={styles.error}>{errors.endDate}</span>}
          </label>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}

        <button
          className={styles.submit}
          type="submit"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Creating schedule…' : 'Create Schedule'}
        </button>
      </form>
    </div>
  );
}
