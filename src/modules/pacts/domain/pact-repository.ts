import { createToken } from '@/core/di';
import type { Token } from '@/core/di';
import type { Result } from '@/core/errors';

export interface Pact {
  id: string;
  circleId: string;
  title: string;
  description: string;
  createdBy: string;
  /** Members who checked in on the requested day. */
  doneCount: number;
  /** Current member count of the circle. */
  memberCount: number;
  /** Whether the current user already checked in on the requested day. */
  checkedInByMe: boolean;
}

export interface PactInput {
  title: string;
  description: string;
}

export interface PactRepository {
  listByCircle(circleId: string, day: string): Promise<Result<Pact[]>>;
  get(pactId: string, day: string): Promise<Result<Pact>>;
  create(circleId: string, input: PactInput): Promise<Result<Pact>>;
  update(pactId: string, input: PactInput): Promise<Result<Pact>>;
  remove(pactId: string): Promise<Result<void>>;
  checkIn(pactId: string, day: string): Promise<Result<void>>;
}

export const pactRepositoryToken: Token<PactRepository> =
  createToken<PactRepository>('PactRepository');
