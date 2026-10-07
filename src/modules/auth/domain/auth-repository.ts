import { createToken } from '@/core/di';
import type { Token } from '@/core/di';
import type { Result } from '@/core/errors';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthRepository {
  signUp(input: RegisterInput): Promise<Result<AuthUser>>;
  signIn(input: SignInInput): Promise<Result<AuthUser>>;
  signOut(): Promise<Result<void>>;
  getCurrentUser(): Promise<Result<AuthUser | null>>;
  subscribe(listener: (user: AuthUser | null) => void): () => void;
}

export const authRepositoryToken: Token<AuthRepository> =
  createToken<AuthRepository>('AuthRepository');
