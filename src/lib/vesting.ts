import type { ApiVestingSchedule } from '@/services/api';

export function fmtStroops(stroops: string) {
  return (Number(stroops) / 1e7).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function vestPct(s: Pick<ApiVestingSchedule, 'cliffTime' | 'endTime'>, now = Math.floor(Date.now() / 1000)): number {
  if (now < s.cliffTime) return 0;
  if (now >= s.endTime)  return 100;
  if (s.endTime === s.cliffTime) return 100;
  return Math.round(((now - s.cliffTime) / (s.endTime - s.cliffTime)) * 100);
}
