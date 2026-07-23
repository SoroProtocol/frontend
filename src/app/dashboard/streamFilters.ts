import type { ApiStream } from '@/services/api';

export type StatusFilter  = 'all' | 'active' | 'cancelled' | 'completed';
export type TokenFilter   = 'all' | 'native' | 'usdc';
export type SortField     = 'created' | 'rate';
export type SortDirection = 'asc' | 'desc';

export interface StreamQuery {
  status:        StatusFilter;
  token:         TokenFilter;
  sortField:     SortField;
  sortDirection: SortDirection;
}

export const DEFAULT_QUERY: StreamQuery = {
  status:        'all',
  token:         'all',
  sortField:     'created',
  sortDirection: 'desc',
};

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'All statuses' },
  { value: 'active',    label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export const TOKEN_OPTIONS: { value: TokenFilter; label: string }[] = [
  { value: 'all',    label: 'All tokens' },
  { value: 'native', label: 'XLM (Native)' },
  { value: 'usdc',   label: 'USDC' },
];

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'created', label: 'Created date' },
  { value: 'rate',    label: 'Rate' },
];

/**
 * Apply a {@link StreamQuery} to an array of streams entirely client-side.
 *
 * The logic is kept as a pure, framework-free function that mirrors what a
 * server-side query (`?status=…&token=…&sort=…`) would return, so it can be
 * lifted to the API layer later without touching the UI.
 */
export function selectStreams(streams: ApiStream[], query: StreamQuery): ApiStream[] {
  const filtered = streams.filter(
    s =>
      (query.status === 'all' || s.status === query.status) &&
      (query.token === 'all' || s.token === query.token),
  );

  const dir = query.sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    if (query.sortField === 'rate') {
      const ra = BigInt(a.ratePerSecond || '0');
      const rb = BigInt(b.ratePerSecond || '0');
      return ra < rb ? -dir : ra > rb ? dir : 0;
    }
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return (ta - tb) * dir;
  });
}
