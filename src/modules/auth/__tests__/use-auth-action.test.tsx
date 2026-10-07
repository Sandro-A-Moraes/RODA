import { act, renderHook } from '@testing-library/react-native';

import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import { useAuthAction } from '../presentation/use-auth-action';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('useAuthAction', () => {
  it('is pending while the action runs and not pending after', async () => {
    const gate = deferred<Result<string>>();
    const action = jest.fn(() => gate.promise);
    const { result } = await renderHook(() => useAuthAction(action));
    expect(result.current.pending).toBe(false);

    let running: Promise<void> = Promise.resolve();
    await act(async () => {
      running = result.current.run();
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      gate.resolve(ok('done'));
      await running;
    });
    expect(result.current.pending).toBe(false);
  });

  it('invokes the action once for two immediate run calls', async () => {
    const gate = deferred<Result<string>>();
    const action = jest.fn((_value: string) => gate.promise);
    const { result } = await renderHook(() => useAuthAction(action));

    await act(async () => {
      const first = result.current.run('a');
      const second = result.current.run('a');
      gate.resolve(ok('done'));
      await Promise.all([first, second]);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('sets error on an error result and clears it on a later success', async () => {
    const failure = createAppError(
      'unauthorized',
      'E-mail ou senha incorretos',
    );
    const action = jest
      .fn<Promise<Result<string>>, []>()
      .mockResolvedValueOnce(err(failure))
      .mockResolvedValueOnce(ok('done'));
    const { result } = await renderHook(() => useAuthAction(action));

    await act(() => result.current.run());
    expect(result.current.error).toEqual(failure);

    await act(() => result.current.run());
    expect(result.current.error).toBeNull();
  });

  it('retry re-runs the action with the last arguments', async () => {
    const action = jest
      .fn<Promise<Result<string>>, [string, number]>()
      .mockResolvedValue(err(createAppError('network')));
    const { result } = await renderHook(() => useAuthAction(action));

    await act(() => result.current.run('ana@mail.com', 7));
    await act(() => result.current.retry());

    expect(action).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenNthCalledWith(2, 'ana@mail.com', 7);
  });

  it('turns a thrown action into a mapped AppError instead of rejecting', async () => {
    const action = jest.fn(async (): Promise<Result<string>> => {
      throw new TypeError('Network request failed');
    });
    const { result } = await renderHook(() => useAuthAction(action));

    await act(async () => {
      await expect(result.current.run()).resolves.toBeUndefined();
    });

    expect(result.current.error).toEqual(createAppError('network'));
    expect(result.current.pending).toBe(false);
  });
});
