import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { useLoad } from '@/shared/hooks/use-load';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorBanner,
  Header,
  Icon,
  Screen,
  Text,
} from '@/shared/ui';

import { longMoment } from '../domain/meetup-format';
import { meetupRepositoryToken } from '../domain/meetup-repository';
import type { Meetup, Rsvp } from '../domain/meetup-repository';

export interface MeetupDetailScreenProps {
  circleId: string;
  meetupId: string;
  currentUserId: string;
  onBack: () => void;
}

const TONES = ['brand', 'accent', 'sage'] as const;

// Figma 25: the meetup, who is going with the count, and the RSVP buttons.
// There is no get-by-id: the circle's upcoming list is the source, so a
// meetup that already started reads as not found.
export function MeetupDetailScreen({
  circleId,
  meetupId,
  currentUserId,
  onBack,
}: MeetupDetailScreenProps) {
  const repo = useDependency(meetupRepositoryToken);
  const { colors, spacing } = useTheme();
  const { state, reload } = useLoad(
    useCallback(
      () => repo.listUpcoming(circleId, new Date()),
      [repo, circleId],
    ),
  );
  const answer = useCallback(
    async (rsvp: Rsvp) => {
      const result = await repo.setRsvp(meetupId, rsvp);
      if (result.ok) await reload();
      return result;
    },
    [repo, meetupId, reload],
  );
  const { run, retry, pending, error } = useAsyncAction(answer);

  let body;
  let footer = null;
  if (state.status === 'loading') {
    body = (
      <ActivityIndicator
        accessibilityLabel="Carregando"
        color={colors.accent}
      />
    );
  } else if (state.status === 'error') {
    body = <ErrorBanner error={state.error} onRetry={() => void reload()} />;
  } else {
    const meetup: Meetup | undefined = state.data.find(
      (m) => m.id === meetupId,
    );
    if (!meetup) {
      body = (
        <EmptyState
          title="Encontro não encontrado"
          body="Ele já aconteceu ou não está mais disponível."
        />
      );
    } else {
      const count = meetup.going.length;
      body = (
        <>
          <View
            style={{
              gap: spacing.sm,
              padding: spacing.lg,
              borderRadius: radius.xl,
              backgroundColor: colors.brand,
            }}
          >
            <Text type="label" style={{ color: colors.onInverseSecondary }}>
              {longMoment(meetup.startsAt)}
            </Text>
            <Text type="h1" style={{ color: colors.onBrand }}>
              {meetup.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Icon name="pin" size={18} color={colors.onInverseSecondary} />
              <Text
                type="body"
                style={{ flex: 1, color: colors.onInverseSecondary }}
              >
                {meetup.place}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text type="h3">Quem vai</Text>
            <Text type="captionStrong" style={{ color: colors.accent }}>
              {count === 1 ? '1 confirmado' : `${count} confirmados`}
            </Text>
          </View>
          {meetup.going.map((attendee, index) => (
            <View
              key={attendee.userId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <Avatar name={attendee.name} tone={TONES[index % TONES.length]} />
              <Text type="bodyStrong" style={{ flex: 1 }}>
                {attendee.name}
              </Text>
              {attendee.userId === currentUserId ? (
                <View
                  style={{
                    paddingHorizontal: spacing.md,
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
        </>
      );
      footer = (
        <View style={{ gap: spacing.sm, padding: spacing.md }}>
          <ErrorBanner error={error} onRetry={() => void retry()} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Eu vou"
                variant={meetup.myRsvp === 'going' ? 'primary' : 'secondary'}
                loading={pending}
                onPress={() => void run('going')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Não vou"
                variant={
                  meetup.myRsvp === 'not_going' ? 'primary' : 'secondary'
                }
                loading={pending}
                onPress={() => void run('not_going')}
              />
            </View>
          </View>
        </View>
      );
    }
  }

  return (
    <Screen>
      <Header title="Encontro" onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {body}
      </ScrollView>
      {footer}
    </Screen>
  );
}
