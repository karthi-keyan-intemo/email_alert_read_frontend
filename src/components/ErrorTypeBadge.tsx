import { ErrorType } from '../types/emailAlert';

interface ErrorTypeBadgeProps {
  type: ErrorType;
}

export function ErrorTypeBadge({ type }: ErrorTypeBadgeProps) {
  const isUnknown = type === 'UNKNOWN';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide',
        isUnknown
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-rose-300 bg-rose-50 text-rose-800',
      ].join(' ')}
    >
      {type === 'UNKNOWN' ? 'UNKNOWN' : 'RESPONSE VALIDATION'}
    </span>
  );
}
