import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { useLoad } from '@/shared/hooks/use-load';
import { Button, Chip, EmptyState, ErrorBanner, Text } from '@/shared/ui';

import { meetupRepositoryToken } from '../domain/meetup-repository';
import type { Meetup, Rsvp } from '../domain/meetup-repository';

export interface MeetupsViewProps {
  circleId: string;
  /** Opens the propose form. */
  onPropose: () => void;
}

const PROPOSE_LABEL = 'Propor encontro';

const pad = (n: number) => String(n).padStart(2, '0');

/** DD/MM/AAAA às HH:MM in the device's local time. */
export function formatMeetupMoment(date: Date): string {
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` +
    ` às ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

interface MeetupCardProps {
  meetup: Meetup;
  onAnswer: (meetupId: string, rsvp: Rsvp) => void;
}

function MeetupCard({ meetup, onAnswer }: MeetupCardProps) {
  const { colors, spacing } = useTheme();
  const going = meetup.goingNames.length;
  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.card,
      }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text type="h3">{meetup.title}</Text>
        <Text type="bodyStrong">{formatMeetupMoment(meetup.startsAt)}</Text>
        <Text type="caption" variant="secondary">
          {meetup.place}
        </Text>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text type="captionStrong" style={{ color: colors.accent }}>
          {going > 0 ? `${going} vão` : 'Ninguém confirmou ainda'}
        </Text>
        {going > 0 ? (
          <Text type="caption" variant="secondary">
            {meetup.goingNames.join(', ')}
          </Text>
        ) : null}
      </View>
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

// Upcoming meetups of the circle, each with an RSVP (MEET-03, MEET-04). The
// going count is the only number shown, as the spec allows; no popularity.
export function MeetupsView({ circleId, onPropose }: MeetupsViewProps) {
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
          onAnswer={(id, rsvp) => void run(id, rsvp)}
        />
      ))}
    </View>
  );
}
