import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useLoad } from '@/shared/hooks/use-load';
import { Avatar, ErrorBanner, Ring, Text } from '@/shared/ui';
import type { Result } from '@/core/errors';

import {
  circleRepositoryToken,
  MAX_CIRCLE_MEMBERS,
} from '../domain/circle-repository';
import type { Circle, Member } from '../domain/circle-repository';
import { InviteCodeActions } from './invite-code-actions';

const tones = ['brand', 'accent', 'sage'] as const;

export interface MembersViewProps {
  circleId: string;
  currentUserId: string;
}

export function MembersView({ circleId, currentUserId }: MembersViewProps) {
  const repo = useDependency(circleRepositoryToken);
  const { colors, spacing } = useTheme();
  const { state, reload } = useLoad(
    useCallback(async (): Promise<
      Result<{ circle: Circle; members: Member[] }>
    > => {
      const [circle, members] = await Promise.all([
        repo.get(circleId),
        repo.members(circleId),
      ]);
      if (!circle.ok) return circle;
      if (!members.ok) return members;
      return {
        ok: true,
        value: { circle: circle.value, members: members.value },
      };
    }, [repo, circleId]),
  );

  if (state.status === 'loading') {
    return (
      <ActivityIndicator
        accessibilityLabel="Carregando"
        color={colors.accent}
      />
    );
  }
  if (state.status === 'error') {
    return <ErrorBanner error={state.error} onRetry={() => void reload()} />;
  }
  const { circle, members } = state.data;
  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.inverse,
        }}
      >
        <Ring size={72} filled={circle.memberCount} tone="inverse" />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text type="label" style={{ color: colors.onInverseSecondary }}>
            Código de convite
          </Text>
          <Text
            type="h1"
            selectable
            accessibilityLabel={`Código de convite ${circle.inviteCode}`}
            style={{ color: colors.onInverse }}
          >
            {circle.inviteCode}
          </Text>
          <Text type="caption" style={{ color: colors.onInverseSecondary }}>
            {`${circle.memberCount} de ${MAX_CIRCLE_MEMBERS} membros`}
          </Text>
        </View>
      </View>
      <InviteCodeActions
        circleName={circle.name}
        inviteCode={circle.inviteCode}
      />
      <View>
        {members.map((member, index) => (
          <View
            key={member.userId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Avatar
              name={member.displayName}
              tone={tones[index % tones.length]}
            />
            <Text type="bodyStrong" style={{ flex: 1 }}>
              {member.displayName}
            </Text>
            {member.userId === currentUserId ? (
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: colors.card,
                }}
              >
                <Text type="captionStrong">Você</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
