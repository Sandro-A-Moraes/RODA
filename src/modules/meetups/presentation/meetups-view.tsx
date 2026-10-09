import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { useLoad } from '@/shared/hooks/use-load';
import { Button, Chip, EmptyState, ErrorBanner, Icon, Text } from '@/shared/ui';

import { dayBadge, goingSummary, weekdayTime } from '../domain/meetup-format';
import { meetupRepositoryToken } from '../domain/meetup-repository';
import type { Meetup, Rsvp } from '../domain/meetup-repository';

export interface MeetupsViewProps {
  circleId: string;
  currentUserId: string;
  /** Opens the propose form. */
  onPropose: () => void;
  /** Opens the detail of a meetup (Figma 25). */
  onOpen: (meetupId: string) => void;
}

const PROPOSE_LABEL = 'Propor encontro';

interface MeetupCardProps {
  meetup: Meetup;
  currentUserId: string;
  onOpen: (meetupId: string) => void;
  onAnswer: (meetupId: string, rsvp: Rsvp) => void;
}

function MeetupCard({
  meetup,
  currentUserId,
  onOpen,
  onAnswer,
}: MeetupCardProps) {
  const { colors, spacing } = useTheme();
  const badge = dayBadge(meetup.startsAt);
  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.card,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${meetup.title}`}
        onPress={() => onOpen(meetup.id)}
        style={{ gap: spacing.md }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: radius.md,
              backgroundColor: colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text type="h2" style={{ color: colors.onBrand }}>
              {badge.day}
            </Text>
            <Text type="label" style={{ color: colors.onBrand }}>
              {badge.month}
            </Text>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text type="h3">{meetup.title}</Text>
            <Detail icon="pin" text={meetup.place} />
            <Detail icon="calendar" text={weekdayTime(meetup.startsAt)} />
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <Icon name="people" size={18} color={colors.accent} />
          <Text type="captionStrong" style={{ flex: 1 }}>
            {goingSummary(meetup.going, currentUserId)}
          </Text>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Chip
          label="Eu vou"
          selected={meetup.myRsvp === 'going'}
          onPress={() => onAnswer(meetup.id, 'going')}
        />
        <Chip
          label="Não vou"
          selected={meetup.myRsvp === 'not_going'}
          onPress={() => onAnswer(meetup.id, 'not_going')}
        />
      </View>
    </View>
  );
}

function Detail({ icon, text }: { icon: 'pin' | 'calendar'; text: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
    >
      <Icon name={icon} size={16} color={colors.textSecondary} />
      <Text type="caption" variant="secondary" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

// Upcoming meetups of the circle, each with an RSVP (MEET-03, MEET-04). The
// going count is the only number shown, as the spec allows; no popularity.
export function MeetupsView({
  circleId,
  currentUserId,
  onPropose,
  onOpen,
}: MeetupsViewProps) {
  const repo = useDependency(meetupRepositoryToken);
  const { colors, spacing } = useTheme();
  const { state, reload } = useLoad(
    useCallback(
      () => repo.listUpcoming(circleId, new Date()),
      [repo, circleId],
    ),
  );
  const answer = useCallback(
    async (meetupId: string, rsvp: Rsvp) => {
      const result = await repo.setRsvp(meetupId, rsvp);
      if (result.ok) await reload();
      return result;
    },
    [repo, reload],
  );
  const { run, retry, error } = useAsyncAction(answer);

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
  if (state.data.length === 0) {
    return (
      <View style={{ gap: spacing.md }}>
        <EmptyState
          title="Nenhum encontro marcado"
          body="Proponha algo para o círculo fazer junto, fora da tela."
        />
        <Button label={PROPOSE_LABEL} onPress={onPropose} />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <ErrorBanner error={error} onRetry={() => void retry()} />
      {state.data.map((meetup) => (
        <MeetupCard
          key={meetup.id}
          meetup={meetup}
          currentUserId={currentUserId}
          onOpen={onOpen}
          onAnswer={(id, rsvp) => void run(id, rsvp)}
        />
      ))}
    </View>
  );
}
