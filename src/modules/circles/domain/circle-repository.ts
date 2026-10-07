import { createToken } from '@/core/di';
import type { Token } from '@/core/di';
import type { Result } from '@/core/errors';

export const MAX_CIRCLE_MEMBERS = 12;

export interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export interface Member {
  userId: string;
  displayName: string;
}

export interface CircleRepository {
  listMine(): Promise<Result<Circle[]>>;
  get(circleId: string): Promise<Result<Circle>>;
  members(circleId: string): Promise<Result<Member[]>>;
  create(name: string): Promise<Result<Circle>>;
  join(inviteCode: string): Promise<Result<Circle>>;
}

export const circleRepositoryToken: Token<CircleRepository> =
  createToken<CircleRepository>('CircleRepository');
