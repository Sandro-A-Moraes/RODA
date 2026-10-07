import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import type {
  AuthRepository,
  AuthUser,
  RegisterInput,
  SignInInput,
} from '../domain/auth-repository';

interface StoredAccount {
  user: AuthUser;
  password: string;
}

type Listener = (user: AuthUser | null) => void;

export class InMemoryAuthRepository implements AuthRepository {
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly listeners = new Set<Listener>();
  private currentUser: AuthUser | null = null;
  private nextId = 1;

  async signUp(input: RegisterInput): Promise<Result<AuthUser>> {
    if (this.accounts.has(input.email)) {
      return err(createAppError('conflict', 'Este e-mail já está cadastrado'));
    }
    const user: AuthUser = {
      id: `user-${this.nextId++}`,
      email: input.email,
      displayName: input.displayName,
    };
    this.accounts.set(input.email, { user, password: input.password });
    this.setSession(user);
    return ok(user);
  }

  async signIn(input: SignInInput): Promise<Result<AuthUser>> {
    const account = this.accounts.get(input.email);
    if (!account || account.password !== input.password) {
      return err(createAppError('unauthorized', 'E-mail ou senha incorretos'));
    }
    this.setSession(account.user);
    return ok(account.user);
  }

  async signOut(): Promise<Result<void>> {
    this.setSession(null);
    return ok(undefined);
  }

  async getCurrentUser(): Promise<Result<AuthUser | null>> {
    return ok(this.currentUser);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setSession(user: AuthUser | null): void {
    this.currentUser = user;
    this.listeners.forEach((listener) => listener(user));
  }
}
