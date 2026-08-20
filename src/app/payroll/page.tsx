'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import type { PayrollState, RecipientResult } from './types';
import { distribute, distributeCustom } from '@/services/distributor';
import { ModeStep } from './ModeStep';
import { RecipientsStep } from './RecipientsStep';
import { DetailsStep } from './DetailsStep';
import { ReviewStep } from './ReviewStep';
import { ResultsStep } from './ResultsStep';
import styles from './payroll.module.css';

const STEPS = ['Mode', 'Recipients', 'Details', 'Review', 'Results'];

const INITIAL: PayrollState = {
  mode: null,
  recipients: [],
  token: 'native',
  ratePerDay: '',
  startDate: '',
  stopDate: '',
};

export default function PayrollPage() {
  const { address } = useWallet();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<PayrollState>(INITIAL);
  const [results, setResults] = useState<RecipientResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [detailsErrors, setDetailsErrors] = useState<Partial<Record<string, string>>>({});

  if (!address) {
    return (
      <div className={styles.gated}>
        <p>Connect your wallet to use batch payroll.</p>
      </div>
    );
  }

  function updateField(field: string, value: string) {
    setState(s => ({ ...s, [field]: value }));
    setDetailsErrors(e => ({ ...e, [field]: undefined }));
  }

  function validateStep(s: number): boolean {
    if (s === 0) return state.mode !== null;
    if (s === 1) return state.recipients.length > 0;
    if (s === 2) {
      const e: Partial<Record<string, string>> = {};
      if (state.mode === 'uniform' && (!state.ratePerDay || Number(state.ratePerDay) <= 0)) {
        e.ratePerDay = 'Must be > 0';
      }
      if (!state.startDate) e.startDate = 'Required';
      if (!state.stopDate) e.stopDate = 'Required';
      if (state.startDate && state.stopDate && state.stopDate <= state.startDate) {
        e.stopDate = 'Must be after start date';
      }
      if (state.mode === 'custom') {
        const invalid = state.recipients.filter(r => !r.amount || Number(r.amount) <= 0);
        if (invalid.length > 0) e.recipients = `${invalid.length} recipient(s) missing amount`;
      }
      setDetailsErrors(e);
      return Object.keys(e).length === 0;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      let txResults: { success: boolean; txHash?: string; error?: string }[];
      if (state.mode === 'uniform') {
        txResults = await distribute({
          sender: address!,
          token: state.token,
          recipients: state.recipients.map(r => r.address),
          ratePerDay: Number(state.ratePerDay),
          startDate: state.startDate,
          stopDate: state.stopDate,
        });
      } else {
        txResults = await distributeCustom({
          sender: address!,
          token: state.token,
          recipients: state.recipients.map(r => ({ address: r.address, amount: Number(r.amount) })),
          startDate: state.startDate,
          stopDate: state.stopDate,
        });
      }
      const recipientResults: RecipientResult[] = state.recipients.map((r, i) => ({
        address: r.address,
        success: txResults[i]?.success ?? false,
        txHash: txResults[i]?.txHash,
        error: txResults[i]?.error,
      }));
      setResults(recipientResults);
      setStep(4);
      const ok = recipientResults.filter(r => r.success).length;
      toast.success(`${ok}/${recipientResults.length} payments submitted`);
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  function canGoNext(): boolean {
    if (step === 0) return state.mode !== null;
    if (step === 1) return state.recipients.length > 0;
    if (step === 2) return true; // validated on click
    if (step === 3) return !submitting;
    return false;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Batch Payroll</h1>

      <div className={styles.progress}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`${styles.progressStep} ${
              i < step ? styles.progressStepDone : i === step ? styles.progressStepActive : ''
            }`}
          />
        ))}
      </div>
      <p className={styles.stepLabel}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {step === 0 && <ModeStep selected={state.mode} onSelect={m => setState(s => ({ ...s, mode: m }))} />}
      {step === 1 && state.mode && (
        <RecipientsStep
          mode={state.mode}
          recipients={state.recipients}
          onChange={recipients => setState(s => ({ ...s, recipients }))}
        />
      )}
      {step === 2 && state.mode && (
        <DetailsStep
          mode={state.mode}
          token={state.token}
          ratePerDay={state.ratePerDay}
          startDate={state.startDate}
          stopDate={state.stopDate}
          errors={detailsErrors}
          onChange={updateField}
        />
      )}
      {step === 3 && <ReviewStep state={state} />}
      {step === 4 && <ResultsStep results={results} />}

      {step < 4 && (
        <div className={styles.btnRow}>
          {step > 0 && (
            <button type="button" className={styles.backBtn} onClick={goBack}>Back</button>
          )}
          {step < 3 ? (
            <button type="button" className={styles.nextBtn} onClick={goNext} disabled={!canGoNext()}>Next</button>
          ) : (
            <button type="button" className={styles.submit} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Confirm & Submit'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
