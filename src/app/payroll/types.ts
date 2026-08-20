export type PayrollMode = 'uniform' | 'custom';

export interface Recipient {
  address: string;
  amount: string; // per-person amount (custom mode) or empty (uniform mode)
}

export interface PayrollState {
  mode: PayrollMode | null;
  recipients: Recipient[];
  token: string;
  ratePerDay: string;     // uniform mode: rate per day for everyone
  startDate: string;
  stopDate: string;
}

export interface RecipientResult {
  address: string;
  success: boolean;
  error?: string;
  txHash?: string;
}

export const ADDRESS_RE = /^G[A-Z2-7]{55}$/;

export function parseCsvAddresses(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map(line => line.trim())
    .filter(line => ADDRESS_RE.test(line));
}

export function parseCsvFile(content: string): Recipient[] {
  const lines = content.split('\n').filter(l => l.trim());
  const recipients: Recipient[] = [];
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    const addr = parts[0];
    if (ADDRESS_RE.test(addr)) {
      recipients.push({ address: addr, amount: parts[1] ?? '' });
    }
  }
  return recipients;
}
