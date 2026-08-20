/**
 * Stream contract method wrappers.
 *
 * Each function encodes the correct Soroban ScVal arguments and delegates
 * to the core client for build → simulate → sign → submit.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { executeContractTx, getRpcClient, getNetworkConfig } from './client';
import { STREAM_CONTRACT_ID } from './constants';
import { ContractError, ContractErrorCode, parseContractError } from './errors';
import type { CreateStreamArgs, StreamData, TxResult } from './types';

function requireContract(): string {
  if (!STREAM_CONTRACT_ID) {
    throw new ContractError(ContractErrorCode.NotFound, 'STREAM_CONTRACT_ID not set in env');
  }
  return STREAM_CONTRACT_ID;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toScValAddress(address: string): StellarSdk.xdr.ScVal {
  return StellarSdk.Address.addressToScVal(address);
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
 * Create a new payment stream on-chain.
 *
 * @param args    - Stream parameters (recipient, token, amount, time range)
 * @param source  - Sender's Stellar public key
 * @returns TxResult with hash and ledger
 */
export async function createStream(args: CreateStreamArgs, source: string): Promise<TxResult> {
  const contractId = requireContract();

  const scArgs: StellarSdk.xdr.ScVal[] = [
    toScValAddress(args.recipient),
    toScValBytes32(args.token),
    toScValI128(args.amount),
    toScValU64(args.startTime),
    toScValU64(args.stopTime),
  ];

  return executeContractTx(contractId, 'create_stream', scArgs, source);
}

/**
 * Withdraw available funds from an active stream.
 * Only callable by the stream recipient.
 *
 * @param streamId - The on-chain stream ID
 * @param source   - Recipient's Stellar public key
 */
export async function withdrawStream(streamId: string, source: string): Promise<TxResult> {
  const contractId = requireContract();

  const scArgs: StellarSdk.xdr.ScVal[] = [
    StellarSdk.nativeToScVal(streamId, { type: 'bytes' }),
  ];

  return executeContractTx(contractId, 'withdraw', scArgs, source);
}

/**
 * Cancel an active stream. Only callable by the stream sender.
 * Remaining funds are returned to the sender.
 *
 * @param streamId - The on-chain stream ID
 * @param source   - Sender's Stellar public key
 */
export async function cancelStream(streamId: string, source: string): Promise<TxResult> {
  const contractId = requireContract();

  const scArgs: StellarSdk.xdr.ScVal[] = [
    StellarSdk.nativeToScVal(streamId, { type: 'bytes' }),
  ];

  return executeContractTx(contractId, 'cancel', scArgs, source);
}

// ── Read Methods ────────────────────────────────────────────────────────────

/**
 * Get the current withdrawable balance for a stream.
 * This is a read-only contract call — no signing required.
 *
 * @param streamId - The on-chain stream ID
 * @param source   - Public key to simulate against
 * @returns Balance in stroops as a bigint string
 */
export async function getStreamBalance(streamId: string, source: string): Promise<string> {
  const contractId = requireContract();
  const rpc = getRpcClient();
  const config = getNetworkConfig();

  const contract = new StellarSdk.Contract(contractId);
  const invocation = contract.call(
    'balance_of',
    StellarSdk.nativeToScVal(streamId, { type: 'bytes' }),
  );

  const account = await rpc.loadAccount(source);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: config.passphrase,
  })
    .addOperation(invocation)
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

  const response = await rpc.simulateTransaction(tx);

  if (StellarSdk.SorobanRpc.Api.isSimulationError(response)) {
    throw parseContractError(response.error);
  }

  // Extract the result — it's an i128 ScVal
  if (!response.resultXdr) return '0';

  const result = StellarSdk.xdr.TransactionResult.fromXDR(response.resultXdr, 'base64');
  const results = result.result().results();
  if (results.length === 0) return '0';

  const val = results[0].tr().invokeHostFunction().success().returnValue();
  return StellarSdk.scValToNative(val).toString();
}

/**
 * Get full stream data from the contract.
 *
 * @param streamId - The on-chain stream ID
 * @param source   - Public key to simulate against
 * @returns StreamData object
 */
export async function getStream(streamId: string, source: string): Promise<StreamData> {
  const contractId = requireContract();
  const rpc = getRpcClient();
  const config = getNetworkConfig();

  const contract = new StellarSdk.Contract(contractId);
  const invocation = contract.call(
    'get_stream',
    StellarSdk.nativeToScVal(streamId, { type: 'bytes' }),
  );

  const account = await rpc.loadAccount(source);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: config.passphrase,
  })
    .addOperation(invocation)
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

  const response = await rpc.simulateTransaction(tx);

  if (StellarSdk.SorobanRpc.Api.isSimulationError(response)) {
    throw parseContractError(response.error);
  }

  if (!response.resultXdr) {
    throw new ContractError(ContractErrorCode.NotFound, 'No result from get_stream');
  }

  const result = StellarSdk.xdr.TransactionResult.fromXDR(response.resultXdr, 'base64');
  const results = result.result().results();
  if (results.length === 0) {
    throw new ContractError(ContractErrorCode.NotFound, 'Empty result from get_stream');
  }

  const val = results[0].tr().invokeHostFunction().success().returnValue();
  const native = StellarSdk.scValToNative(val) as Record<string, unknown>;

  return {
    id:            String(native.id ?? streamId),
    sender:        String(native.sender ?? ''),
    recipient:     String(native.recipient ?? ''),
    token:         String(native.token ?? ''),
    ratePerSecond: String(native.rate_per_second ?? native.ratePerSecond ?? '0'),
    startTime:     Number(native.start_time ?? native.startTime ?? 0),
    stopTime:      Number(native.stop_time ?? native.stopTime ?? 0),
    withdrawn:     String(native.withdrawn ?? '0'),
    status:        (native.status as string) ?? 'active',
  };
}
