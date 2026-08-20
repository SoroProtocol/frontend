/**
 * Network configuration for Soroban RPC.
 *
 * Reads from NEXT_PUBLIC_* env vars so the values are baked in at build time
 * and available in the browser bundle (they're safe to expose — RPC URLs and
 * contract IDs are public on-chain data).
 */

export type NetworkName = 'testnet' | 'mainnet';

export interface NetworkConfig {
  name:       NetworkName;
  sorobanRpc: string;
  passphrase: string;
}

const NETWORK_MAP: Record<NetworkName, { rpc: string; passphrase: string }> = {
  testnet: {
    rpc:       'https://soroban-testnet.stellar.org',
    passphrase: 'Test Soro Network ; December 2022',
  },
  mainnet: {
    rpc:       'https://soroban-mainnet.stellar.org',
    passphrase: 'Public Global Stellar Network ; September 2015',
  },
};

/**
 * Resolve the network configuration from environment variables.
 * Falls back to testnet when unset or invalid.
 */
export function getNetwork(): NetworkConfig {
  const raw = (process.env.NEXT_PUBLIC_NETWORK ?? 'testnet').toLowerCase();
  const name: NetworkName = raw === 'mainnet' ? 'mainnet' : 'testnet';
  const env = NETWORK_MAP[name];

  return {
    name,
    sorobanRpc: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || env.rpc,
    passphrase: env.passphrase,
  };
}
