import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import { MAX_CIRCLE_MEMBERS } from '../domain/circle-repository';
import type {
  Circle,
  CircleRepository,
  Member,
} from '../domain/circle-repository';

export interface CurrentUser {
  id: string;
  displayName: string;
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

interface StoredCircle {
  id: string;
  name: string;
  inviteCode: string;
  members: Member[];
}

// Same rules as the SQL functions, for tests and early development (AD-002).
export class InMemoryCircleRepository implements CircleRepository {
  private readonly circles: StoredCircle[] = [];
  private sequence = 0;

  constructor(private readonly currentUser: () => CurrentUser | null) {}

  private toCircle(stored: StoredCircle): Circle {
    return {
      id: stored.id,
      name: stored.name,
      inviteCode: stored.inviteCode,
      memberCount: stored.members.length,
    };
  }

  private findMine(circleId: string): StoredCircle | undefined {
    const user = this.currentUser();
    return this.circles.find(
      (c) => c.id === circleId && c.members.some((m) => m.userId === user?.id),
    );
  }

  private newCode(): string {
    for (;;) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
      if (!this.circles.some((c) => c.inviteCode === code)) return code;
    }
  }

  async listMine(): Promise<Result<Circle[]>> {
    const user = this.currentUser();
    if (!user) return err(createAppError('unauthorized'));
    return ok(
      this.circles
        .filter((c) => c.members.some((m) => m.userId === user.id))
        .map((c) => this.toCircle(c)),
    );
  }

  async get(circleId: string): Promise<Result<Circle>> {
    const found = this.findMine(circleId);
    return found ? ok(this.toCircle(found)) : err(createAppError('not_found'));
  }

  async members(circleId: string): Promise<Result<Member[]>> {
    const found = this.findMine(circleId);
    return found ? ok([...found.members]) : err(createAppError('not_found'));
  }

  async create(name: string): Promise<Result<Circle>> {
    const user = this.currentUser();
    if (!user) return err(createAppError('unauthorized'));
    this.sequence += 1;
    const stored: StoredCircle = {
      id: `circle-${this.sequence}`,
      name,
      inviteCode: this.newCode(),
      members: [{ userId: user.id, displayName: user.displayName }],
    };
    this.circles.push(stored);
    return ok(this.toCircle(stored));
  }

  async join(inviteCode: string): Promise<Result<Circle>> {
    const user = this.currentUser();
    if (!user) return err(createAppError('unauthorized'));
    const stored = this.circles.find(
      (c) => c.inviteCode === inviteCode.trim().toUpperCase(),
    );
    if (!stored) {
      return err(createAppError('not_found', 'Código não encontrado'));
    }
    if (stored.members.some((m) => m.userId === user.id)) {
      return err(createAppError('conflict', 'Você já faz parte deste círculo'));
    }
    if (stored.members.length >= MAX_CIRCLE_MEMBERS) {
      return err(createAppError('conflict', 'Este círculo está cheio'));
    }
    stored.members.push({ userId: user.id, displayName: user.displayName });
    return ok(this.toCircle(stored));
  }
}
