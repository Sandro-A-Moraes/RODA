import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mapError } from '@/core/errors';
import type { AppError, Result } from '@/core/errors';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: AppError }
  | { status: 'ready'; data: T };

// Runs `load` whenever the screen gains focus, so lists refresh after a
// create/join flow returns. `reload` is stable enough to hand to a retry button.
export function useLoad<T>(load: () => Promise<Result<T>>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    try {
      const result = await loadRef.current();
      setState(
        result.ok
          ? { status: 'ready', data: result.value }
          : { status: 'error', error: result.error },
      );
    } catch (thrown) {
      setState({ status: 'error', error: mapError(thrown) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { state, reload, setState };
}
