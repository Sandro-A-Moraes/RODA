import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import type {
  Pact,
  PactInput,
  PactRepository,
} from '../domain/pact-repository';

interface StoredPact {
  id: string;
  circleId: string;
  title: string;
  description: string;
  createdBy: string;
}

interface CheckIn {
  pactId: string;
  userId: string;
  day: string;
}

// Same rules as the SQL schema, for tests and early development (AD-002).
export class InMemoryPactRepository implements PactRepository {
  private readonly pacts: StoredPact[] = [];
  private readonly checkIns: CheckIn[] = [];
  private sequence = 0;

  constructor(
    private readonly currentUserId: () => string | null,
    private readonly memberCount: (circleId: string) => number,
    // Mirrors is_circle_member. Omitted means every user belongs to every
    // circle, which keeps callers that do not model membership working.
    private readonly isMember: (
      circleId: string,
      userId: string,
    ) => boolean = () => true,
  ) {}

  private canSee(stored: StoredPact): boolean {
    const me = this.currentUserId();
    return me !== null && this.isMember(stored.circleId, me);
  }

  private view(stored: StoredPact, day: string): Pact {
    const me = this.currentUserId();
    const today = this.checkIns.filter(
      (c) => c.pactId === stored.id && c.day === day,
    );
    return {
      ...stored,
      doneCount: today.length,
      memberCount: this.memberCount(stored.circleId),
      checkedInByMe: today.some((c) => c.userId === me),
    };
  }

  async listByCircle(circleId: string, day: string): Promise<Result<Pact[]>> {
    return ok(
      this.pacts
        .filter((p) => p.circleId === circleId && this.canSee(p))
        .map((p) => this.view(p, day)),
    );
  }

  async get(pactId: string, day: string): Promise<Result<Pact>> {
    const found = this.pacts.find((p) => p.id === pactId);
    return found && this.canSee(found)
      ? ok(this.view(found, day))
      : err(createAppError('not_found'));
  }

  async create(circleId: string, input: PactInput): Promise<Result<Pact>> {
    const me = this.currentUserId();
    if (!me || !this.isMember(circleId, me)) {
      return err(createAppError('unauthorized'));
    }
    this.sequence += 1;
    const stored: StoredPact = {
      id: `pact-${this.sequence}`,
      circleId,
      createdBy: me,
      ...input,
    };
    this.pacts.push(stored);
    return ok(this.view(stored, ''));
  }

  async update(pactId: string, input: PactInput): Promise<Result<Pact>> {
    const found = this.pacts.find((p) => p.id === pactId);
    if (!found) return err(createAppError('not_found'));
    if (found.createdBy !== this.currentUserId()) {
      return err(createAppError('unauthorized'));
    }
    Object.assign(found, input);
    return ok(this.view(found, ''));
  }

  async remove(pactId: string): Promise<Result<void>> {
    const index = this.pacts.findIndex((p) => p.id === pactId);
    if (index < 0) return err(createAppError('not_found'));
    if (this.pacts[index].createdBy !== this.currentUserId()) {
      return err(createAppError('unauthorized'));
    }
    this.pacts.splice(index, 1);
    for (let i = this.checkIns.length - 1; i >= 0; i -= 1) {
      if (this.checkIns[i].pactId === pactId) this.checkIns.splice(i, 1);
    }
    return ok(undefined);
  }

  async checkIn(pactId: string, day: string): Promise<Result<void>> {
    const me = this.currentUserId();
    if (!me) return err(createAppError('unauthorized'));
    const pact = this.pacts.find((p) => p.id === pactId);
    if (!pact) return err(createAppError('not_found'));
    // Same refusal as the check_ins insert policy.
    if (!this.isMember(pact.circleId, me)) {
      return err(createAppError('unauthorized'));
    }
    if (
      this.checkIns.some(
        (c) => c.pactId === pactId && c.userId === me && c.day === day,
      )
    ) {
      return err(createAppError('conflict', 'Você já fez check-in hoje'));
    }
    this.checkIns.push({ pactId, userId: me, day });
    return ok(undefined);
  }
}
