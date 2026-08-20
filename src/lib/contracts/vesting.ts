/**
 * Vesting contract method wrappers.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { executeContractTx, getRpcClient, getNetworkConfig, extractSimulationResult } from './client';
import { VESTING_CONTRACT_ID } from './constants';
import { ContractError, ContractErrorCode, parseContractError } from './errors';
import type { CreateVestingArgs, VestingScheduleData, TxResult } from './types';

function requireContract(): string {
  if (!VESTING_CONTRACT_ID) {
    throw new ContractError(ContractErrorCode.NotFound, 'VESTING_CONTRACT_ID not set in env');
  }
  return VESTING_CONTRACT_ID;
}

function toScValAddress(address: string): StellarSdk.xdr.ScVal {
  return StellarSdk.Address.fromString(address).toScVal();
}

function toScValI128(value: string | bigint): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: 'i128' });
}

function toScValU64(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: 'u64' });
}

function toScValBytes32(hex: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(hex, { type: 'bytes' });
}

// ── Write Methods ───────────────────────────────────────────────────────────

/**
 * Create a new vesting schedule on-chain.
 */
export async function createVestingSchedule(args: CreateVestingArgs, source: string): Promise<TxResult> {
  const contractId = requireContract();

  const scArgs: StellarSdk.xdr.ScVal[] = [
    toScValAddress(args.beneficiary),
    toScValAddress(args.token),
    toScValI128(args.totalAmount),
    toScValU64(args.startTime),
    toScValU64(args.cliffTime),
    toScValU64(args.endTime),
  ];

  return executeContractTx(contractId, 'create_schedule', scArgs, source);
}

/**
 * Claim vested tokens from a schedule. Only callable by the beneficiary.
 */
export async function claimVesting(scheduleId: string, source: string): Promise<TxResult> {
  const contractId = requireContract();

  const scArgs: StellarSdk.xdr.ScVal[] = [
    StellarSdk.nativeToScVal(scheduleId, { type: 'bytes' }),
  ];

  return executeContractTx(contractId, 'claim', scArgs, source);
}

/**
 * Revoke a vesting schedule. Only callable by the schedule creator.
 * Unvested tokens are returned to the creator.
 */
export async function revokeVesting(scheduleId: string, source: string): Promise<TxResult> {
  const contractId = requireContract();

  const scArgs: StellarSdk.xdr.ScVal[] = [
    StellarSdk.nativeToScVal(scheduleId, { type: 'bytes' }),
  ];

  return executeContractTx(contractId, 'revoke', scArgs, source);
}

// ── Read Methods ────────────────────────────────────────────────────────────

/**
 * Get the currently vested amount for a schedule (read-only).
 */
export async function getVestedOf(scheduleId: string, source: string): Promise<string> {
  const contractId = requireContract();
  const rpc = getRpcClient();
  const config = getNetworkConfig();

  const contract = new StellarSdk.Contract(contractId);
  const invocation = contract.call(
    'vested_of',
    StellarSdk.nativeToScVal(scheduleId, { type: 'bytes' }),
  );

  const account = await rpc.getAccount(source);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: config.passphrase,
  })
    .addOperation(invocation)
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

  const response = await rpc.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(response)) {
    throw parseContractError(response.error);
  }

  const val = extractSimulationResult(response);
  if (!val) return '0';

  return StellarSdk.scValToNative(val).toString();
}

/**
 * Get full vesting schedule data from the contract (read-only).
 */
export async function getVestingSchedule(scheduleId: string, source: string): Promise<VestingScheduleData> {
  const contractId = requireContract();
  const rpc = getRpcClient();
  const config = getNetworkConfig();

  const contract = new StellarSdk.Contract(contractId);
  const invocation = contract.call(
    'get_schedule',
    StellarSdk.nativeToScVal(scheduleId, { type: 'bytes' }),
  );

  const account = await rpc.getAccount(source);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: config.passphrase,
  })
    .addOperation(invocation)
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

  const response = await rpc.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(response)) {
    throw parseContractError(response.error);
  }

  const val = extractSimulationResult(response);
  if (!val) {
    throw new ContractError(ContractErrorCode.ScheduleNotFound);
  }

  const native = StellarSdk.scValToNative(val) as Record<string, unknown>;

  return {
    id:          String(native.id ?? scheduleId),
    beneficiary: String(native.beneficiary ?? ''),
    token:       String(native.token ?? ''),
    totalAmount: String(native.total_amount ?? native.totalAmount ?? '0'),
    startTime:   Number(native.start_time ?? native.startTime ?? 0),
    cliffTime:   Number(native.cliff_time ?? native.cliffTime ?? 0),
    endTime:     Number(native.end_time ?? native.endTime ?? 0),
    claimed:     String(native.claimed ?? '0'),
    revoked:     Boolean(native.revoked),
  };
}
