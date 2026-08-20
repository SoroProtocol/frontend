'use client';
/**
 * React hook for executing contract transactions with loading/error states.
 *
 * Wraps the contract methods to provide a clean React interface:
 *   const { execute, loading, error } = useContract();
 *   await execute(() => streams.createStream(args, address));
 */

import { useState, useCallback } from 'react';
import { ContractError, parseContractError } from '@/lib/contracts';

interface UseContractReturn {
  /** Execute a contract call. Returns the result on success, throws on error. */
  execute: <T>(fn: () => Promise<T>) => Promise<T | null>;
  /** True while a contract call is in flight */
  loading: boolean;
  /** Error message from the last failed call (cleared on next execute) */
  error: string | null;
  /** The typed error code from the last failed call, if it's a ContractError */
  errorCode: ContractError['code'] | null;
  /** Clear the current error state */
  clearError: () => void;
}

export function useContract(): UseContractReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ContractError['code'] | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const execute = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const result = await fn();
      return result;
    } catch (err) {
      const parsed = parseContractError(err);
      setError(parsed.message);
      setErrorCode(parsed.code);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, errorCode, clearError };
}
