/**
 * Unified export for the contract service layer.
 *
 * Usage:
 *   import { streams, vesting, distributor } from '@/lib/contracts';
 *   const result = await streams.createStream({ ... }, walletAddress);
 */

import * as streamsMethods from './streams';
import * as vestingMethods from './vesting';
import * as distributorMethods from './distributor';

export const streams    = streamsMethods;
export const vesting    = vestingMethods;
export const distributor = distributorMethods;

// Re-export types and utilities
export { ContractError, ContractErrorCode, parseContractError } from './errors';
export { getRpcClient, getNetworkConfig, resetRpcClient } from './client';
export { STREAM_CONTRACT_ID, VESTING_CONTRACT_ID, DISTRIBUTOR_CONTRACT_ID } from './constants';
export type * from './types';
