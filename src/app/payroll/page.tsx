'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { usePayrollForm } from '@/hooks/usePayrollForm';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { distribute, distributeCustom } from '@/lib/contracts/distributor';
import type { RecipientResult } from './types';
import { calcEscrow } from '@/lib/payroll';
import { ModeStep } from './ModeStep';
import { RecipientsStep } from './RecipientsStep';
import { DetailsStep } from './DetailsStep';
import { ReviewStep } from './ReviewStep';
import { ResultsStep } from './ResultsStep';
import { ConfirmDialog } from './ConfirmDialog';
import styles from './payroll.module.css';

const STEPS = ['Mode', 'Recipients', 'Details', 'Review', 'Results'];

export default function PayrollPage() {
  const { address } = useWallet();
  const toast = useToast();
  const {
    state, errors, setMode, setRecipients, setField,
    validateDetails, validateRecipients, totalEscrow, reset,
  } = usePayrollForm();

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<RecipientResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useKeyboardNav({
    onBack: step > 0 && step < 4 ? () => setStep(s => s - 1) : undefined,
    onNext: step < 3 ? () => goNext() : undefined,
    enabled: !showConfirm && !submitting,
  });

  if (!address) {
    return (
      <div className={styles.gated}>
        <p>Connect your wallet to use batch payroll.</p>
      </div>
    );
  }

  function validateStep(s: number): boolean {
    if (s === 0) return state.mode !== null;
    if (s === 1) return validateRecipients();
    if (s === 2) return validateDetails();
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
    setShowConfirm(false);
    setSubmitting(true);
    try {
      let txResults: { success: boolean; txHash?: string; error?: string }[];
      if (state.mode === 'uniform') {
        const result = await distribute(
          { token: state.token, amount: state.ratePerDay, recipients: state.recipients.map(r => r.address) },
          address!,
        );
        txResults = state.recipients.map(() => ({ success: true, txHash: result.hash }));
      } else {
        const result = await distributeCustom(
          {
            token: state.token,
            amounts: state.recipients.map(r => r.amount),
            recipients: state.recipients.map(r => r.address),
          },
          address!,
        );
        txResults = state.recipients.map(() => ({ success: true, txHash: result.hash }));
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
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const escrow = state.mode
    ? calcEscrow(state.mode, state.recipients, state.ratePerDay, state.startDate, state.stopDate)
    : 0;

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
      <p className={styles.stepLabel} aria-live="polite">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {step === 0 && <ModeStep selected={state.mode} onSelect={setMode} />}
      {step === 1 && state.mode && (
        <RecipientsStep mode={state.mode} recipients={state.recipients} onChange={setRecipients} />
      )}
      {step === 2 && state.mode && (
        <DetailsStep
          mode={state.mode}
          token={state.token}
          ratePerDay={state.ratePerDay}
          startDate={state.startDate}
          stopDate={state.stopDate}
          errors={errors}
          onChange={setField}
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
            <button type="button" className={styles.nextBtn} onClick={goNext}>Next</button>
          ) : (
            <button type="button" className={styles.submit} onClick={() => setShowConfirm(true)} disabled={submitting}>
              Review & Submit
            </button>
          )}
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button type="button" className={styles.backBtn} onClick={reset}>New Payroll</button>
          <Link href="/dashboard" className={styles.dashLink} style={{ marginLeft: '0.75rem' }}>Dashboard</Link>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          total={escrow}
          token={state.token}
          recipientCount={state.recipients.length}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
