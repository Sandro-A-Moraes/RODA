import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface Token<T> {
  readonly name: string;
  // Phantom field so Token<A> and Token<B> are distinct types.
  readonly __type?: T;
}

export interface Provision {
  readonly token: Token<unknown>;
  readonly value: unknown;
}

export function createToken<T>(name: string): Token<T> {
  return { name };
}

export function provide<T>(token: Token<T>, value: T): Provision {
  return { token, value };
}

const DependencyContext = createContext<ReadonlyMap<Token<unknown>, unknown>>(
  new Map(),
);

export function DependencyProvider({
  provisions,
  children,
}: {
  provisions: Provision[];
  children: ReactNode;
}) {
  const registry = new Map(provisions.map((p) => [p.token, p.value]));
  return (
    <DependencyContext.Provider value={registry}>
      {children}
    </DependencyContext.Provider>
  );
}

export function useDependency<T>(token: Token<T>): T {
  const registry = useContext(DependencyContext);
  if (!registry.has(token)) {
    throw new Error(`Dependency "${token.name}" is not registered`);
  }
  return registry.get(token) as T;
}
