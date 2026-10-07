import type { SupabaseClient } from '@supabase/supabase-js';

import { createAppError, err, mapError, ok } from '@/core/errors';
import type { AppError, Result } from '@/core/errors';

import type {
  Circle,
  CircleRepository,
  Member,
} from '../domain/circle-repository';

interface CircleRow {
  id: string;
  name: string;
  invite_code: string;
  circle_members?: { count: number }[];
}

const circleColumns = 'id, name, invite_code, circle_members(count)';

function toCircle(row: CircleRow): Circle {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    memberCount: row.circle_members?.[0]?.count ?? 0,
  };
}

// The SQL functions raise short codes; the backend text never reaches the user.
export function mapCircleError(thrown: unknown): AppError {
  const message =
    typeof thrown === 'object' && thrown !== null && 'message' in thrown
      ? String((thrown as { message: unknown }).message)
      : '';
  if (message.includes('circle_full')) {
    return createAppError('conflict', 'Este círculo está cheio');
  }
  if (message.includes('already_member')) {
    return createAppError('conflict', 'Você já faz parte deste círculo');
  }
  if (message.includes('not_found')) {
    return createAppError('not_found', 'Código não encontrado');
  }
  if (message.includes('unauthorized')) {
    return createAppError('unauthorized');
  }
  return mapError(thrown);
}

// Thin adapter, validated manually against the real project (AD-002).
export class SupabaseCircleRepository implements CircleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<Result<Circle[]>> {
    try {
      const { data, error } = await this.client
        .from('circles')
        .select(circleColumns)
        .order('created_at', { ascending: true });
      if (error) return err(mapCircleError(error));
      return ok((data as CircleRow[]).map(toCircle));
    } catch (thrown) {
      return err(mapCircleError(thrown));
    }
  }

  async get(circleId: string): Promise<Result<Circle>> {
    try {
      const { data, error } = await this.client
        .from('circles')
        .select(circleColumns)
        .eq('id', circleId)
        .maybeSingle();
      if (error) return err(mapCircleError(error));
      if (!data) return err(createAppError('not_found'));
      return ok(toCircle(data as CircleRow));
    } catch (thrown) {
      return err(mapCircleError(thrown));
    }
  }

  async members(circleId: string): Promise<Result<Member[]>> {
    try {
      const { data, error } = await this.client
        .from('circle_members')
        .select('user_id, profiles(display_name)')
        .eq('circle_id', circleId)
        .order('joined_at', { ascending: true });
      if (error) return err(mapCircleError(error));
      const rows = data as unknown as {
        user_id: string;
        profiles: { display_name: string } | null;
      }[];
      return ok(
        rows.map((row) => ({
          userId: row.user_id,
          displayName: row.profiles?.display_name ?? '—',
        })),
      );
    } catch (thrown) {
      return err(mapCircleError(thrown));
    }
  }

  async create(name: string): Promise<Result<Circle>> {
    return this.callRpc('create_circle', { p_name: name });
  }

  async join(inviteCode: string): Promise<Result<Circle>> {
    return this.callRpc('join_circle', { p_code: inviteCode });
  }

  private async callRpc(
    fn: string,
    args: Record<string, string>,
  ): Promise<Result<Circle>> {
    try {
      const { data, error } = await this.client.rpc(fn, args);
      if (error) return err(mapCircleError(error));
      // The RPC returns the circle row; reload it to get the member count.
      return this.get((data as { id: string }).id);
    } catch (thrown) {
      return err(mapCircleError(thrown));
    }
  }
}
