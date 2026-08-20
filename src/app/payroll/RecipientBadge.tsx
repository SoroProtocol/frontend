interface Props {
  count: number;
}

export function RecipientBadge({ count }: Props) {
  if (count === 0) return null;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--accent)', color: '#fff', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem',
      marginLeft: '0.4rem', minWidth: '1.2rem',
    }}>
      {count}
    </span>
  );
}
