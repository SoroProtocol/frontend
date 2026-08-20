/**
 * Distributor contract client — placeholder for Soroban SDK integration.
 *
 * The distributor contract lets you create N payment streams in one
 * transaction. Once the Soroban SDK is wired up, these functions will
 * build and submit the actual transactions via Freighter.
 */

export interface DistributeArgs {
  sender: string;
  token: string;
  recipients: string[];
  ratePerDay: number;
  startDate: string;
  stopDate: string;
}

export interface DistributeCustomArgs {
  sender: string;
  token: string;
  recipients: { address: string; amount: number }[];
  startDate: string;
  stopDate: string;
}

export interface DistributeResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Calls distributor.distribute() for uniform rate mode.
 * TODO: Replace with actual Soroban SDK transaction via Freighter.
 */
export async function distribute(args: DistributeArgs): Promise<DistributeResult[]> {
  // eslint-disable-next-line no-console
  console.log('[distributor] distribute called', args);
  // Simulated — each recipient gets a success/failure result
  return args.recipients.map(address => ({
    success: true,
    txHash: `sim_${Date.now()}_${address.slice(0, 8)}`,
  }));
}

/**
 * Calls distributor.distribute_custom() for custom amounts mode.
 * TODO: Replace with actual Soroban SDK transaction via Freighter.
 */
export async function distributeCustom(args: DistributeCustomArgs): Promise<DistributeResult[]> {
  // eslint-disable-next-line no-console
  console.log('[distributor] distribute_custom called', args);
  return args.recipients.map(r => ({
    success: true,
    txHash: `sim_${Date.now()}_${r.address.slice(0, 8)}`,
  }));
}
