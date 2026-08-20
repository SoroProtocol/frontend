import { describe, it, expect } from 'vitest';
import { ContractError, ContractErrorCode, parseContractError } from './errors';
import { getNetwork } from './network';
import {
  STREAM_CONTRACT_ID,
  VESTING_CONTRACT_ID,
  DISTRIBUTOR_CONTRACT_ID,
  BASE_FEE,
  TX_CONFIRM_TIMEOUT_MS,
  TX_POLL_INTERVAL_MS,
} from './constants';

// ── ContractError ───────────────────────────────────────────────────────────

describe('ContractError', () => {
  it('creates an error with the correct code and message', () => {
    const err = new ContractError(ContractErrorCode.NotFound);
    expect(err.code).toBe(ContractErrorCode.NotFound);
    expect(err.message).toBe('Stream not found on-chain');
    expect(err.name).toBe('ContractError');
    expect(err instanceof Error).toBe(true);
  });

  it('appends detail to the base message', () => {
    const err = new ContractError(ContractErrorCode.Unauthorized, 'wallet 0xABC');
    expect(err.message).toBe('You are not authorized for this action: wallet 0xABC');
  });
});

// ── parseContractError ──────────────────────────────────────────────────────

describe('parseContractError', () => {
  it('returns the same ContractError if already typed', () => {
    const original = new ContractError(ContractErrorCode.AlreadyCancelled);
    const parsed = parseContractError(original);
    expect(parsed).toBe(original);
  });

  it('parses user rejection errors', () => {
    const parsed = parseContractError(new Error('User denied the transaction'));
    expect(parsed.code).toBe(ContractErrorCode.UserRejected);
  });

  it('parses Freighter denial', () => {
    const parsed = parseContractError(new Error('UserDeclined'));
    expect(parsed.code).toBe(ContractErrorCode.UserRejected);
  });

  it('parses simulation errors', () => {
    const parsed = parseContractError(new Error('SimulateTxFailed: something went wrong'));
    expect(parsed.code).toBe(ContractErrorCode.SimulationFailed);
  });

  it('extracts contract error code from simulation message', () => {
    const parsed = parseContractError(new Error('SimulateTxFailed: contract_error(3) occurred'));
    expect(parsed.code).toBe(ContractErrorCode.AlreadyCancelled);
  });

  it('parses network errors', () => {
    const parsed = parseContractError(new Error('fetch failed ECONNREFUSED'));
    expect(parsed.code).toBe(ContractErrorCode.NetworkError);
  });

  it('parses submission errors', () => {
    const parsed = parseContractError(new Error('submit TxFailed'));
    expect(parsed.code).toBe(ContractErrorCode.SubmitFailed);
  });

  it('falls back to SimulationFailed for unknown errors', () => {
    const parsed = parseContractError(new Error('something weird happened'));
    expect(parsed.code).toBe(ContractErrorCode.SimulationFailed);
    expect(parsed.message).toContain('something weird happened');
  });

  it('handles non-Error values', () => {
    const parsed = parseContractError('raw string error');
    expect(parsed.code).toBe(ContractErrorCode.SimulationFailed);
    expect(parsed.message).toContain('raw string error');
  });
});

// ── Network config ──────────────────────────────────────────────────────────

describe('getNetwork', () => {
  it('returns a valid network config object', () => {
    const config = getNetwork();
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('sorobanRpc');
    expect(config).toHaveProperty('passphrase');
    expect(['testnet', 'mainnet']).toContain(config.name);
  });

  it('has a non-empty RPC URL', () => {
    const config = getNetwork();
    expect(config.sorobanRpc).toBeTruthy();
    expect(config.sorobanRpc.startsWith('http')).toBe(true);
  });

  it('has a non-empty passphrase', () => {
    const config = getNetwork();
    expect(config.passphrase.length).toBeGreaterThan(10);
  });
});

// ── Constants ───────────────────────────────────────────────────────────────

describe('contract constants', () => {
  it('BASE_FEE is a valid stroops amount', () => {
    expect(Number(BASE_FEE)).toBeGreaterThan(0);
  });

  it('TX_CONFIRM_TIMEOUT_MS is at least 10 seconds', () => {
    expect(TX_CONFIRM_TIMEOUT_MS).toBeGreaterThanOrEqual(10_000);
  });

  it('TX_POLL_INTERVAL_MS is at least 500ms', () => {
    expect(TX_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(500);
  });

  it('TX_POLL_INTERVAL_MS is less than TX_CONFIRM_TIMEOUT_MS', () => {
    expect(TX_POLL_INTERVAL_MS).toBeLessThan(TX_CONFIRM_TIMEOUT_MS);
  });
});
