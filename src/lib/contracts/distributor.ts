/**
 * Distributor contract method wrappers.
 *
 * The distributor contract handles batch token distribution — send the
 * same amount to multiple recipients, or different amounts per recipient.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { executeContractTx } from './client';
import { DISTRIBUTOR_CONTRACT_ID } from './constants';
import { ContractError, ContractErrorCode } from './errors';
import type { DistributeArgs, DistributeCustomArgs, TxResult } from './types';

function requireContract(): string {
  if (!DISTRIBUTOR_CONTRACT_ID) {
    throw new ContractError(ContractErrorCode.NotFound, 'DISTRIBUTOR_CONTRACT_ID not set in env');
  }
  return DISTRIBUTOR_CONTRACT_ID;
}

function toScValBytes32(hex: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(hex, { type: 'bytes' });
}

function toScValI128(value: string | bigint): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: 'i128' });
}

function toScValAddress(address: string): StellarSdk.xdr.ScVal {
  return StellarSdk.Address.addressToScVal(address);
}

/**
 * Distribute equal amounts of a token to multiple recipients.
 *
 * @param args     - Token, amount per recipient, and recipient list
 * @param source   - Distributor's Stellar public key
 */
export async function distribute(args: DistributeArgs, source: string): Promise<TxResult> {
  const contractId = requireContract();

  // Build the Soroban Vec of addresses
  const recipientVals = args.recipients.map(r => toScValAddress(r));
  const recipientsVec = StellarSdk.xdr.ScVal.scvVec(recipientVals);

  const scArgs: StellarSdk.xdr.ScVal[] = [
    toScValBytes32(args.token),
    toScValI128(args.amount),
    recipientsVec,
  ];

  return executeContractTx(contractId, 'distribute', scArgs, source);
}

/**
 * Distribute custom (different) amounts to multiple recipients.
 * The amounts and recipients arrays must be the same length.
 *
 * @param args     - Token, per-recipient amounts, and recipient list
 * @param source   - Distributor's Stellar public key
 */
export async function distributeCustom(args: DistributeCustomArgs, source: string): Promise<TxResult> {
  const contractId = requireContract();

  if (args.amounts.length !== args.recipients.length) {
    throw new ContractError(
      ContractErrorCode.InvalidAmount,
      'Amounts and recipients arrays must be the same length',
    );
  }

  const recipientVals = args.recipients.map(r => toScValAddress(r));
  const amountVals = args.amounts.map(a => toScValI128(a));

  const scArgs: StellarSdk.xdr.ScVal[] = [
    toScValBytes32(args.token),
    StellarSdk.xdr.ScVal.scvVec(amountVals),
    StellarSdk.xdr.ScVal.scvVec(recipientVals),
  ];

  return executeContractTx(contractId, 'distribute_custom', scArgs, source);
}
