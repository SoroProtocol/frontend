import { calcDurationDays, calcUniformPerRecipient, validateRecipients } from './payroll';
import type { Recipient } from '@/app/payroll/types';

describe('calcDurationDays', () => {
  it('returns 0 for missing dates', () => {
    expect(calcDurationDays('', '')).toBe(0);
  });

  it('calculates days between dates', () => {
    const start = new Date('2025-01-01T00:00').toISOString().slice(0, 16);
    const end = new Date('2025-01-11T00:00').toISOString().slice(0, 16);
    expect(calcDurationDays(start, end)).toBe(10);
  });

  it('returns 0 for end before start', () => {
    const start = new Date('2025-01-10T00:00').toISOString().slice(0, 16);
    const end = new Date('2025-01-01T00:00').toISOString().slice(0, 16);
    expect(calcDurationDays(start, end)).toBe(0);
  });
});

describe('calcUniformPerRecipient', () => {
  it('multiplies rate by days', () => {
    const start = new Date('2025-01-01T00:00').toISOString().slice(0, 16);
    const end = new Date('2025-01-11T00:00').toISOString().slice(0, 16);
    expect(calcUniformPerRecipient('10', start, end)).toBe(100);
  });
});

describe('validateRecipients', () => {
  it('rejects empty list', () => {
    expect(validateRecipients([], 'uniform')).toContain('At least one recipient is required');
  });

  it('rejects over 200 recipients', () => {
    const many = Array.from({ length: 201 }, (_, i) => ({
      address: `G${'A'.repeat(54)}${i}`.slice(0, 56),
      amount: '',
    }));
    expect(validateRecipients(many, 'uniform')).toContain('Maximum 200 recipients per batch');
  });

  it('catches duplicates', () => {
    const r: Recipient[] = [
      { address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', amount: '' },
      { address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', amount: '' },
    ];
    expect(validateRecipients(r, 'uniform')).toEqual(
      expect.arrayContaining([expect.stringContaining('Duplicate')]),
    );
  });

  it('catches invalid amounts in custom mode', () => {
    const r: Recipient[] = [{ address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', amount: '0' }];
    expect(validateRecipients(r, 'custom')).toEqual(
      expect.arrayContaining([expect.stringContaining('invalid amount')]),
    );
  });
});
