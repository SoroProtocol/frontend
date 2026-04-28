import type { StreamCardProps } from '@/components/molecules/StreamCard';

/**
 * Exports stream history to a CSV file and triggers browser download.
 */
export function exportStreamsCsv(streams: StreamCardProps[], filename = 'streams.csv') {
  const headers = ['ID', 'Recipient', 'Token', 'Rate/day (XLM)', 'Start', 'Stop', 'Status'];
  const rows = streams.map(s => [
    s.id,
    s.recipient,
    s.token,
    (Number(s.ratePerSecond) * 86400 / 1e7).toFixed(4),
    new Date(s.startTime * 1000).toISOString(),
    new Date(s.stopTime  * 1000).toISOString(),
    s.cancelled ? 'Cancelled' : 'Active',
  ]);

  const csv     = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob    = new Blob([csv], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const anchor  = document.createElement('a');
  anchor.href   = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
