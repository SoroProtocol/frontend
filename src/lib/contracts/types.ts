/**
 * Type definitions for Soroban contract function arguments and return values.
 *
 * These mirror the contract's Rust types. Amounts are strings (bigints serialized)
 * to avoid precision loss — JavaScript numbers can't holdstroops values safely.
 */

// ── Stream Contract ─────────────────────────────────────────────────────────

export interface CreateStreamArgs {
  sender:       string;      // Sender's Stellar public key (G...)
  recipient:    string;      // Recipient's Stellar public key (G...)
  token:        string;      // Asset contract address or 'native'
  ratePerSecond: string;     // Payment rate in stroops per second (u64 as string)
  startTime:    number;      // Unix timestamp (seconds)
  stopTime:     number;      // Unix timestamp (seconds)
}

export interface StreamData {
  id:            string;
  sender:        string;
  recipient:     string;
  token:         string;
  ratePerSecond: string;
  startTime:     number;
  stopTime:      number;
  withdrawn:     string;
  status:        'active' | 'cancelled' | 'completed';
}

// ── Vesting Contract ────────────────────────────────────────────────────────

export interface CreateVestingArgs {
  beneficiary: string;    // Stellar public key (G...)
  token:       string;    // Asset contract address or 'native'
  totalAmount: string;    // Total amount in stroops
  startTime:   number;    // Unix timestamp (seconds)
  cliffTime:   number;    // Unix timestamp (seconds)
  endTime:     number;    // Unix timestamp (seconds)
}

export interface VestingScheduleData {
  id:          string;
  beneficiary: string;
  token:       string;
  totalAmount: string;
  startTime:   number;
  cliffTime:   number;
  endTime:     number;
  claimed:     string;
  revoked:     boolean;
}

// ── Distributor Contract ────────────────────────────────────────────────────

export interface DistributeArgs {
  token:    string;       // Asset contract address or 'native'
  amount:   string;       // Amount per recipient in stroops
  recipients: string[];   // Array of Stellar public keys
}

export interface DistributeCustomArgs {
  token:      string;
  amounts:    string[];    // Per-recipient amounts (parallel array with recipients)
  recipients: string[];
}

// ── Simulation Result ───────────────────────────────────────────────────────

export interface SimulationResult {
  assembledXdr: string;    // Assembled XDR with Soroban auth/footprint (ready for signing)
  result:       unknown;   // ScVal return value from the simulation (null if no result)
  auth:         boolean;   // Whether authorization was needed
  cost:         {
    cpuInsns: string;
    memBytes: string;
  };
}

// ── Transaction Result ──────────────────────────────────────────────────────

export interface TxResult {
  hash:    string;
  ledger:  number;
  result:  string;         // Raw XDR result
}
