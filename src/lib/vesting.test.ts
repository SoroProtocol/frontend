import { vestPct } from './vesting';

describe('vestPct', () => {
  it('is 0% before the cliff', () => {
    expect(vestPct({ cliffTime: 1000, endTime: 2000 }, 500)).toBe(0);
  });

  it('is 100% at the cliff when cliff and end coincide', () => {
    expect(vestPct({ cliffTime: 1000, endTime: 1000 }, 1000)).toBe(100);
  });

  it('is 100% once past the end time', () => {
    expect(vestPct({ cliffTime: 1000, endTime: 2000 }, 2500)).toBe(100);
  });

  it('is linear between the cliff and the end time', () => {
    expect(vestPct({ cliffTime: 1000, endTime: 2000 }, 1500)).toBe(50);
  });
});
