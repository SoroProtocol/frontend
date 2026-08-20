/**
 * Core Soroban contract client.
 *
 * Handles the full lifecycle: build XDR → simulate → sign (Freighter) →
 * submit → poll for confirmation. All contract method wrappers call
 * into this client.
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetwork, type NetworkConfig } from './network';
import { ContractError, ContractErrorCode, parseContractError } from './errors';
import { BASE_FEE, TX_CONFIRM_TIMEOUT_MS, TX_POLL_INTERVAL_MS } from './constants';
import type { TxResult, SimulationResult } from './types';

/** Freighter browser extension API (loaded at runtime via window.freighter) */
interface FreighterApi {
  getAddress():      Promise<{ address: string }>;
  getNetwork():      Promise<{ network: string }>;
  signTransaction(xdr: string, opts?: { network?: string }): Promise<{ signedTxXdr: string }>;
}

function getFreighter(): FreighterApi {
  const freighter = (window as any).freighter as FreighterApi | undefined;
  if (!freighter) throw new ContractError(ContractErrorCode.NetworkError, 'Freighter extension not installed');
  return freighter;
}

/** Lazy-initialised Soroban RPC client */
let rpcClient: StellarSdk.SorobanRpc.Server | null = null;

export function getRpcClient(): StellarSdk.SorobanRpc.Server {
  if (!rpcClient) {
    const config = getNetwork();
    rpcClient = new StellarSdk.SorobanRpc.Server(config.sorobanRpc);
  }
  return rpcClient;
}

/**
 * Reset the cached RPC client. Useful when the user switches networks
 * in Freighter and the stale client points at the wrong RPC.
 */
export function resetRpcClient(): void {
  rpcClient = null;
}

/**
 * Get the current network config. Re-reads env vars each call so a
 * network switch in Freighter is picked up without a page reload.
 */
export function getNetworkConfig(): NetworkConfig {
  return getNetwork();
}

// ── XDR Helpers ─────────────────────────────────────────────────────────────

/**
 * Build a Soroban contract invocation transaction (unsigned).
 *
 * @param contractId  - Soroban contract address
 * @param method      - Contract method name
 * @param args        - Method arguments (will be scValEncoded)
 * @param source      - Sender's Stellar public key (account to sign)
 * @returns Unsigned transaction XDR (base64)
 */
export async function buildContractTx(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  source: string,
): Promise<string> {
  const config = getNetwork();
  const rpc = getRpcClient();

  const account = await rpc.loadAccount(source);

  const contract = new StellarSdk.Contract(contractId);
  const invocation = contract.call(method, ...args);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.passphrase,
  })
    .addOperation(invocation)
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

  return tx.toXDR();
}

/**
 * Simulate a transaction to check for errors before signing.
 * Throws a typed ContractError if simulation fails.
 *
 * @param unsignedXdr - Base64 XDR of the unsigned transaction
 * @returns SimulationResult with auth and cost info
 */
export async function simulateTx(unsignedXdr: string): Promise<SimulationResult> {
  const rpc = getRpcClient();
  const tx = new StellarSdk.Transaction(unsignedXdr, getNetwork().passphrase);

  const response = await rpc.simulateTransaction(tx);

  if (StellarSdk.SorobanRpc.Api.isSimulationError(response)) {
    throw parseContractError(response.error);
  }

  return {
    result:    response.resultXdr ?? '',
    auth:      (response.authorizationData ?? []).length > 0,
    cost:      {
      cpuInsns: String(response.cost?.cpuInsns ?? 0),
      memBytes: String(response.cost?.memBytes ?? 0),
    },
  };
}

/**
 * Sign a transaction using Freighter.
 * Freighter pops up a confirmation dialog — the user can approve or reject.
 */
export async function signWithFreighter(unsignedXdr: string): Promise<string> {
  try {
    const freighter = getFreighter();
    const config = getNetwork();
    const { signedTxXdr } = await freighter.signTransaction(unsignedXdr, {
      network: config.passphrase,
    });
    return signedTxXdr;
  } catch (err) {
    throw parseContractError(err);
  }
}

/**
 * Submit a signed transaction to the Soroban network.
 *
 * @param signedXdr - Base64 XDR of the signed transaction
 * @returns TxResult with hash and ledger
 */
export async function submitTx(signedXdr: string): Promise<TxResult> {
  const rpc = getRpcClient();
  const tx = new StellarSdk.Transaction(signedXdr, getNetwork().passphrase);

  try {
    const response = await rpc.sendTransaction(tx);

    if (response.status === 'ERROR') {
      const errStr = response.errorResult
        ? StellarSdk.xdr.TransactionResult.fromXDR(response.errorResult, 'base64').toString()
        : 'Transaction submission failed';
      throw new ContractError(ContractErrorCode.SubmitFailed, errStr);
    }

    // Poll for confirmation
    return await pollForConfirmation(response.hash);
  } catch (err) {
    if (err instanceof ContractError) throw err;
    throw parseContractError(err);
  }
}

/**
 * Poll Soroban RPC until a transaction is confirmed or times out.
 */
async function pollForConfirmation(hash: string): Promise<TxResult> {
  const rpc = getRpcClient();
  const deadline = Date.now() + TX_CONFIRM_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await rpc.getTransaction(hash);

    if (response.status === 'SUCCESS') {
      return {
        hash:    response.hash,
        ledger:  response.ledger,
        result:  response.resultXdr,
      };
    }

    if (response.status === 'FAILED') {
      throw new ContractError(ContractErrorCode.SubmitFailed, `Tx ${hash} failed on-chain`);
    }

    // NOT_FOUND or still pending — wait and retry
    await new Promise(r => setTimeout(r, TX_POLL_INTERVAL_MS));
  }

  throw new ContractError(ContractErrorCode.NetworkError, `Tx ${hash} timed out waiting for confirmation`);
}

// ── High-level helper ───────────────────────────────────────────────────────

/**
 * Build → simulate → sign → submit a contract transaction in one call.
 * This is the main entry point used by contract method wrappers.
 *
 * @returns TxResult on success
 */
export async function executeContractTx(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  source: string,
): Promise<TxResult> {
  // 1. Build unsigned XDR
  const unsignedXdr = await buildContractTx(contractId, method, args, source);

  // 2. Simulate — catches errors before Freighter pops up
  await simulateTx(unsignedXdr);

  // 3. Sign via Freighter (user sees confirmation dialog)
  const signedXdr = await signWithFreighter(unsignedXdr);

  // 4. Submit and wait for confirmation
  return await submitTx(signedXdr);
}
