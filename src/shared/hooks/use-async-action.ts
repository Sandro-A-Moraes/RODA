import { useCallback, useRef, useState } from 'react';

import { mapError } from '@/core/errors';
import type { AppError, Result } from '@/core/errors';

export interface AsyncAction<A extends unknown[]> {
  run: (...args: A) => Promise<void>;
  retry: () => Promise<void>;
  pending: boolean;
  error: AppError | null;
}

export function useAsyncAction<A extends unknown[], T>(
  action: (...args: A) => Promise<Result<T>>,
): AsyncAction<A> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  // State updates are async; the ref closes the window between two presses.
  const locked = useRef(false);
  const lastArgs = useRef<A | null>(null);

  const run = useCallback(
    async (...args: A) => {
      if (locked.current) return;
      locked.current = true;
      lastArgs.current = args;
      setPending(true);
      try {
        const result = await action(...args);
        setError(result.ok ? null : result.error);
      } catch (thrown) {
        setError(mapError(thrown));
      } finally {
        locked.current = false;
        setPending(false);
      }
    },
    [action],
  );

  const retry = useCallback(async () => {
    if (lastArgs.current) await run(...lastArgs.current);
  }, [run]);

  return { run, retry, pending, error };
}
