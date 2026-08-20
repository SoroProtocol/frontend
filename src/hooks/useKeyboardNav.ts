import { useEffect } from 'react';

/**
 * Fires callbacks on keyboard shortcuts.
 * Escape → onBack, Enter → onNext (when not focused on a button/input).
 */
export function useKeyboardNav(opts: {
  onBack?: () => void;
  onNext?: () => void;
  enabled?: boolean;
}) {
  const { onBack, onNext, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && onBack) onBack();
      if (e.key === 'Enter' && onNext) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          onNext();
        }
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onBack, onNext, enabled]);
}
