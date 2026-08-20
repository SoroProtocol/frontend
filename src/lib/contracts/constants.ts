/**
 * Contract addresses and shared constants.
 *
 * All contract IDs come from env vars (set in .env.local per network).
 * These are public on-chain addresses — safe to expose in the browser bundle.
 */

export const STREAM_CONTRACT_ID =
  process.env.NEXT_PUBLIC_STREAM_CONTRACT_ID ?? '';

export const VESTING_CONTRACT_ID =
  process.env.NEXT_PUBLIC_VESTING_CONTRACT_ID ?? '';

export const DISTRIBUTOR_CONTRACT_ID =
  process.env.NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID ?? '';

/** USDC on Stellar testnet — Circle's official issuer */
export const USDC_TESTNET_ISSUER =
  'GA5ZSEJYB37JDD5G4LYXOKMWSUVC5HBH724QZDU5DHVJ76SCZGR5SOY3';

/** Maximum time to wait for transaction confirmation (ms) */
export const TX_CONFIRM_TIMEOUT_MS = 30_000;

/** Polling interval for transaction confirmation (ms) */
export const TX_POLL_INTERVAL_MS = 2_000;

/** Base fee for Soroban transactions (in stroops) */
export const BASE_FEE = '100000';
