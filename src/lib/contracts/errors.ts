/**
 * Typed errors for Soroban contract interactions.
 *
 * Each error maps to a contract error code so the UI can show meaningful
 * messages instead of raw hex. The error names match the contract's
 * enum variants (NotFound, Unauthorized, etc.).
 */

export enum ContractErrorCode {
  NotFound         = 1,
  Unauthorized     = 2,
  AlreadyCancelled = 3,
  InvalidAmount    = 4,
  InvalidTime      = 5,
  StreamExpired    = 6,
  NothingToWithdraw = 7,
  ScheduleNotFound = 8,
  NothingToClaim   = 9,
  AlreadyRevoked   = 10,
  SimulationFailed = 11,
  SubmitFailed     = 12,
  UserRejected     = 13,
  NetworkError     = 14,
}

const ERROR_MESSAGES: Record<ContractErrorCode, string> = {
  [ContractErrorCode.NotFound]:           'Stream not found on-chain',
  [ContractErrorCode.Unauthorized]:       'You are not authorized for this action',
  [ContractErrorCode.AlreadyCancelled]:   'This stream has already been cancelled',
  [ContractErrorCode.InvalidAmount]:      'Invalid amount — must be greater than zero',
  [ContractErrorCode.InvalidTime]:        'Invalid time range — end must be after start',
  [ContractErrorCode.StreamExpired]:      'This stream has already expired',
  [ContractErrorCode.NothingToWithdraw]:  'No funds available to withdraw',
  [ContractErrorCode.ScheduleNotFound]:   'Vesting schedule not found on-chain',
  [ContractErrorCode.NothingToClaim]:     'No vested tokens available to claim',
  [ContractErrorCode.AlreadyRevoked]:     'This vesting schedule has already been revoked',
  [ContractErrorCode.SimulationFailed]:   'Transaction simulation failed — check your inputs',
  [ContractErrorCode.SubmitFailed]:       'Transaction submission failed',
  [ContractErrorCode.UserRejected]:       'Transaction was rejected in Freighter',
  [ContractErrorCode.NetworkError]:       'Network error — check your connection',
};

export class ContractError extends Error {
  readonly code: ContractErrorCode;

  constructor(code: ContractErrorCode, detail?: string) {
    const base = ERROR_MESSAGES[code] ?? 'Unknown contract error';
    super(detail ? `${base}: ${detail}` : base);
    this.name = 'ContractError';
    this.code = code;
  }
}

/**
 * Map a Soroban simulation/submit error response to a typed ContractError.
 * Handles both raw error strings from the SDK and structured error objects
 * from the Soroban RPC.
 */
export function parseContractError(err: unknown): ContractError {
  if (err instanceof ContractError) return err;

  const msg = err instanceof Error ? err.message : String(err);

  // User rejected the transaction in Freighter
  if (msg.includes('rejected') || msg.includes('denied') || msg.includes('UserDeclined')) {
    return new ContractError(ContractErrorCode.UserRejected);
  }

  // Simulation errors from Soroban RPC
  if (msg.includes('simulation') || msg.includes('SimulateTxFailed')) {
    // Try to extract the contract error code from the simulation result
    const codeMatch = msg.match(/contract_error(?:\((\d+)\))?/i);
    if (codeMatch?.[1]) {
      const code = Number(codeMatch[1]) as ContractErrorCode;
      if (ERROR_MESSAGES[code]) return new ContractError(code);
    }
    return new ContractError(ContractErrorCode.SimulationFailed, msg);
  }

  // Network / transport errors
  if (msg.includes('ECONNREFUSED') || msg.includes('fetch') || msg.includes('network')) {
    return new ContractError(ContractErrorCode.NetworkError, msg);
  }

  // Transaction submission failures
  if (msg.includes('submit') || msg.includes('TxFailed')) {
    return new ContractError(ContractErrorCode.SubmitFailed, msg);
  }

  // Fallback: wrap as simulation failed with original message
  return new ContractError(ContractErrorCode.SimulationFailed, msg);
}
