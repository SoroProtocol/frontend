import type { Recipient } from '@/app/payroll/types';

/**
 * Calculate the total escrow cost for a payroll batch.
 */
export function calcEscrow(
  mode: 'uniform' | 'custom',
  recipients: Recipient[],
  ratePerDay: string,
  startDate: string,
  stopDate: string,
): number {
  const days = calcDurationDays(startDate, stopDate);
  if (mode === 'uniform') {
    return recipients.length * Number(ratePerDay || 0) * days;
  }
  return recipients.reduce((sum, r) => sum + Number(r.amount || 0), 0);
}

/**
 * Calculate the duration in days between two datetime-local strings.
 */
export function calcDurationDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

/**
 * Calculate per-recipient escrow in uniform mode.
 */
export function calcUniformPerRecipient(ratePerDay: string, startDate: string, stopDate: string): number {
  return Number(ratePerDay || 0) * calcDurationDays(startDate, stopDate);
}

/**
 * Validate a batch of recipients and return any issues.
 */
export function validateRecipients(recipients: Recipient[], mode: 'uniform' | 'custom'): string[] {
  const issues: string[] = [];
  if (recipients.length === 0) {
    issues.push('At least one recipient is required');
  }
  if (recipients.length > 200) {
    issues.push('Maximum 200 recipients per batch');
  }
  const addrs = new Set<string>();
  for (const r of recipients) {
    if (addrs.has(r.address)) {
      issues.push(`Duplicate address: ${r.address.slice(0, 8)}…`);
    }
    addrs.add(r.address);
    if (mode === 'custom' && (!r.amount || Number(r.amount) <= 0)) {
      issues.push(`${r.address.slice(0, 8)}… has an invalid amount`);
    }
  }
  return issues;
}
