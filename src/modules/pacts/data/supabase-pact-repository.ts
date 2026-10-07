import type { SupabaseClient } from '@supabase/supabase-js';

import { createAppError, err, mapError, ok } from '@/core/errors';
import type { AppError, Result } from '@/core/errors';

import type {
  Pact,
  PactInput,
  PactRepository,
} from '../domain/pact-repository';

interface PactRow {
  id: string;
  circle_id: string;
  title: string;
  description: string;
  created_by: string;
}

interface ProgressRow {
  pact_id: string;
  done_count: number;
  member_count: number;
  i_did: boolean;
}

const columns = 'id, circle_id, title, description, created_by';

export function mapPactError(thrown: unknown): AppError {
  const code =
    typeof thrown === 'object' && thrown !== null && 'code' in thrown
      ? String((thrown as { code: unknown }).code)
      : '';
  // 23505 is the unique (pact, member, day) constraint: a second check-in.
  if (code === '23505') {
    return createAppError('conflict', 'Você já fez check-in hoje');
  }
  // 42501 is a row level security refusal.
  if (code === '42501') return createAppError('unauthorized');
  // 23514 is a check constraint (title or description bounds).
  if (code === '23514') return createAppError('validation');
  return mapError(thrown);
}

// Thin adapter, validated manually against the real project (AD-002).
export class SupabasePactRepository implements PactRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async uid(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user.id ?? null;
  }

  private toPact(row: PactRow, progress?: ProgressRow): Pact {
    return {
      id: row.id,
      circleId: row.circle_id,
      title: row.title,
      description: row.description,
      createdBy: row.created_by,
      doneCount: progress?.done_count ?? 0,
      memberCount: progress?.member_count ?? 0,
      checkedInByMe: progress?.i_did ?? false,
    };
  }

  async listByCircle(circleId: string, day: string): Promise<Result<Pact[]>> {
    try {
      const [pacts, progress] = await Promise.all([
        this.client
          .from('pacts')
          .select(columns)
          .eq('circle_id', circleId)
          .order('created_at', { ascending: true }),
        this.client.rpc('pact_progress', { p_circle: circleId, p_day: day }),
      ]);
      if (pacts.error) return err(mapPactError(pacts.error));
      if (progress.error) return err(mapPactError(progress.error));
      const byPact = new Map(
        (progress.data as ProgressRow[]).map((p) => [p.pact_id, p]),
      );
      return ok(
        (pacts.data as PactRow[]).map((row) =>
          this.toPact(row, byPact.get(row.id)),
        ),
      );
    } catch (thrown) {
      return err(mapPactError(thrown));
    }
  }

  async get(pactId: string, day: string): Promise<Result<Pact>> {
    try {
      const { data, error } = await this.client
        .from('pacts')
        .select(columns)
        .eq('id', pactId)
        .maybeSingle();
      if (error) return err(mapPactError(error));
      if (!data) return err(createAppError('not_found'));
      const row = data as PactRow;
      const progress = await this.client.rpc('pact_progress', {
        p_circle: row.circle_id,
        p_day: day,
      });
      if (progress.error) return err(mapPactError(progress.error));
      const mine = (progress.data as ProgressRow[]).find(
        (p) => p.pact_id === row.id,
      );
      return ok(this.toPact(row, mine));
    } catch (thrown) {
      return err(mapPactError(thrown));
    }
  }

  async create(circleId: string, input: PactInput): Promise<Result<Pact>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      const { data, error } = await this.client
        .from('pacts')
        .insert({
          circle_id: circleId,
          title: input.title,
          description: input.description,
          created_by: uid,
        })
        .select(columns)
        .single();
      if (error) return err(mapPactError(error));
      return ok(this.toPact(data as PactRow));
    } catch (thrown) {
      return err(mapPactError(thrown));
    }
  }

  // Zero affected rows means either the pact is gone or RLS hid the change
  // from a member who is not its creator; only a read can tell them apart.
  private async missingOrForbidden(pactId: string): Promise<AppError> {
    const { data } = await this.client
      .from('pacts')
      .select('id')
      .eq('id', pactId)
      .maybeSingle();
    return createAppError(data ? 'unauthorized' : 'not_found');
  }

  async update(pactId: string, input: PactInput): Promise<Result<Pact>> {
    try {
      const { data, error } = await this.client
        .from('pacts')
        .update({ title: input.title, description: input.description })
        .eq('id', pactId)
        .select(columns)
        .maybeSingle();
      if (error) return err(mapPactError(error));
      if (!data) return err(await this.missingOrForbidden(pactId));
      return ok(this.toPact(data as PactRow));
    } catch (thrown) {
      return err(mapPactError(thrown));
    }
  }

  async remove(pactId: string): Promise<Result<void>> {
    try {
      const { data, error } = await this.client
        .from('pacts')
        .delete()
        .eq('id', pactId)
        .select('id');
      if (error) return err(mapPactError(error));
      if (!data || data.length === 0) {
        return err(await this.missingOrForbidden(pactId));
      }
      return ok(undefined);
    } catch (thrown) {
      return err(mapPactError(thrown));
    }
  }

  async checkIn(pactId: string, day: string): Promise<Result<void>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      const { error } = await this.client
        .from('check_ins')
        .insert({ pact_id: pactId, user_id: uid, day });
      if (error) return err(mapPactError(error));
      return ok(undefined);
    } catch (thrown) {
      return err(mapPactError(thrown));
    }
  }
}
