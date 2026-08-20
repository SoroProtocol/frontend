/**
 * Event type constants for the stream activity feed.
 *
 * Centralised here so both the hook and the UI component share the same
 * labels, colours, and icon glyphs without duplicating strings.
 */

export type StreamEventType =
  | 'StreamCreated'
  | 'Withdrawn'
  | 'Cancelled'
  | 'VestingCreated'
  | 'VestingClaimed'
  | 'VestingRevoked';

/** Human-readable label for each event type */
export const EVENT_LABELS: Record<StreamEventType, string> = {
  StreamCreated:   'Created',
  Withdrawn:       'Withdrawn',
  Cancelled:       'Cancelled',
  VestingCreated:  'Vesting Created',
  VestingClaimed:  'Vesting Claimed',
  VestingRevoked:  'Vesting Revoked',
};

/** Single-character icon glyph for each event type */
export const EVENT_ICONS: Record<StreamEventType, string> = {
  StreamCreated:   '+',
  Withdrawn:       '↓',
  Cancelled:       '×',
  VestingCreated:  '+',
  VestingClaimed:  '↓',
  VestingRevoked:  '×',
};

/** CSS colour value for each event type */
export const EVENT_COLORS: Record<StreamEventType, string> = {
  StreamCreated:   'var(--success, #22c55e)',
  Withdrawn:       'var(--accent, #a78bfa)',
  Cancelled:       'var(--danger, #ef4444)',
  VestingCreated:  'var(--success, #22c55e)',
  VestingClaimed:  'var(--accent, #a78bfa)',
  VestingRevoked:  'var(--danger, #ef4444)',
};

/**
 * Maps raw Soroban event symbol strings (from the first topic) to our
 * typed event names.  The Rust contract emits symbols like "created",
 * "withdrawn", "cancelled", etc.
 */
export const SYMBOL_TO_TYPE: Record<string, StreamEventType> = {
  created:           'StreamCreated',
  withdrawn:         'Withdrawn',
  cancelled:         'Cancelled',
  vesting_created:   'VestingCreated',
  vesting_claimed:   'VestingClaimed',
  vesting_revoked:   'VestingRevoked',
};

/** Filter options for the activity feed UI */
export const EVENT_FILTER_OPTIONS: { value: StreamEventType | 'all'; label: string }[] = [
  { value: 'all',            label: 'All Events' },
  { value: 'StreamCreated',  label: 'Created' },
  { value: 'Withdrawn',      label: 'Withdrawn' },
  { value: 'Cancelled',      label: 'Cancelled' },
  { value: 'VestingCreated', label: 'Vesting Created' },
  { value: 'VestingClaimed', label: 'Vesting Claimed' },
  { value: 'VestingRevoked', label: 'Vesting Revoked' },
];
