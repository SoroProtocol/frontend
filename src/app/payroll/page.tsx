'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import type { PayrollState, RecipientResult } from './types';
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
  const [step, setStep] = useState(0);
  const [state, setState] = useState<PayrollState>(INITIAL);
  const [results, setResults] = useState<RecipientResult[]>([]);

  if (!address) {
    return (
      <div className={styles.gated}>
        <p>Connect your wallet to use batch payroll.</p>
      </div>
    );
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

      {/* Steps will be rendered here */}
    </div>
  );
}
