import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  createToken,
  DependencyProvider,
  provide,
  useDependency,
} from '@/core/di';

interface Greeter {
  greet(): string;
}

function wrapperWith(...provisions: ReturnType<typeof provide>[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DependencyProvider provisions={provisions}>
        {children}
      </DependencyProvider>
    );
  };
}

describe('DependencyProvider', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a registered instance by identity', async () => {
    const token = createToken<Greeter>('Greeter');
    const instance: Greeter = { greet: () => 'oi' };

    const { result } = await renderHook(() => useDependency(token), {
      wrapper: wrapperWith(provide(token, instance)),
    });

    expect(result.current).toBe(instance);
  });

  it('does not collide for tokens with the same name', async () => {
    const first = createToken<Greeter>('Greeter');
    const second = createToken<Greeter>('Greeter');
    const firstInstance: Greeter = { greet: () => 'um' };
    const secondInstance: Greeter = { greet: () => 'dois' };

    const { result } = await renderHook(
      () => ({ a: useDependency(first), b: useDependency(second) }),
      {
        wrapper: wrapperWith(
          provide(first, firstInstance),
          provide(second, secondInstance),
        ),
      },
    );

    expect(result.current.a).toBe(firstInstance);
    expect(result.current.b).toBe(secondInstance);
  });

  it('throws naming the token when it is not registered', async () => {
    const registered = createToken<Greeter>('Registered');
    const missing = createToken<Greeter>('Missing');

    await expect(
      renderHook(() => useDependency(missing), {
        wrapper: wrapperWith(provide(registered, { greet: () => 'oi' })),
      }),
    ).rejects.toThrow('Dependency "Missing" is not registered');
  });

  it('throws the same named error outside any provider', async () => {
    const missing = createToken<Greeter>('Orphan');

    await expect(renderHook(() => useDependency(missing))).rejects.toThrow(
      'Dependency "Orphan" is not registered',
    );
  });
});
