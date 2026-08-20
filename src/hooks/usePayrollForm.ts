import { useState, useCallback } from 'react';
import type { PayrollState, PayrollMode, Recipient } from '@/app/payroll/types';
import { ADDRESS_RE } from '@/app/payroll/types';

const INITIAL: PayrollState = {
  mode: null,
  recipients: [],
  token: 'native',
  ratePerDay: '',
  startDate: '',
  stopDate: '',
};

export function usePayrollForm() {
  const [state, setState] = useState<PayrollState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const setMode = useCallback((mode: PayrollMode) => {
    setState(s => ({ ...s, mode }));
  }, []);

  const setRecipients = useCallback((recipients: Recipient[]) => {
    setState(s => ({ ...s, recipients }));
  }, []);

  const setField = useCallback((field: string, value: string) => {
    setState(s => ({ ...s, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }, []);

  const validateDetails = useCallback((): boolean => {
    const e: Partial<Record<string, string>> = {};
    const s = state;

    if (s.mode === 'uniform' && (!s.ratePerDay || Number(s.ratePerDay) <= 0)) {
      e.ratePerDay = 'Must be > 0';
    }
    if (!s.startDate) e.startDate = 'Required';
    if (!s.stopDate) e.stopDate = 'Required';
    if (s.startDate && s.stopDate && s.stopDate <= s.startDate) {
      e.stopDate = 'Must be after start date';
    }
    if (s.mode === 'custom') {
      const invalid = s.recipients.filter(r => !r.amount || Number(r.amount) <= 0);
      if (invalid.length > 0) e.recipients = `${invalid.length} recipient(s) missing amount`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [state]);

  const validateRecipients = useCallback((): boolean => {
    return state.recipients.length > 0;
  }, [state.recipients]);

  const totalEscrow = useCallback((): number => {
    const days = (() => {
      if (!state.startDate || !state.stopDate) return 0;
      const ms = new Date(state.stopDate).getTime() - new Date(state.startDate).getTime();
      return Math.max(0, ms / (1000 * 60 * 60 * 24));
    })();

    if (state.mode === 'uniform') {
      return state.recipients.length * Number(state.ratePerDay || 0) * days;
    }
    return state.recipients.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [state]);

  const reset = useCallback(() => {
    setState(INITIAL);
    setErrors({});
  }, []);

  return {
    state,
    errors,
    setMode,
    setRecipients,
    setField,
    validateDetails,
    validateRecipients,
    totalEscrow,
    reset,
    isValidAddress: (addr: string) => ADDRESS_RE.test(addr),
  };
}
