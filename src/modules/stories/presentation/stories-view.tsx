import { useCallback } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { daysAgo, localDay } from '@/shared/date/local-day';
import { useLoad } from '@/shared/hooks/use-load';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorBanner,
  Icon,
  Ring,
  Text,
} from '@/shared/ui';

import { storyRepositoryToken } from '../domain/story-repository';
import type { Story } from '../domain/story-repository';
import { ReactionBar, ReceivedReactions } from './reaction-bar';

export interface StoriesViewProps {
  circleId: string;
  /** Opens the composer (Figma 14). */
  onWrite: () => void;
}

/** "hoje", "ontem" or DD/MM, all in the device's local calendar. */
export function formatStoryDay(day: string, today: string): string {
  if (day === today) return 'hoje';
  const [year, month, date] = today.split('-').map(Number);
  if (day === daysAgo(1, new Date(year, month - 1, date))) return 'ontem';
  const [, mm, dd] = day.split('-');
  return `${dd}/${mm}`;
}

/** Whether the current user already has a story on `today` in this list. */
export function sharedToday(stories: Story[], today: string): boolean {
  return stories.some((s) => s.isMine && s.day === today);
}

/** Shown instead of the composer once the member posted today (Figma 08). */
export function AlreadySharedNotice() {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.card,
      }}
    >
      <Icon name="check" size={18} color={colors.textPrimary} />
      <Text type="bodyStrong">Você já compartilhou hoje</Text>
    </View>
  );
}

const WRITE_LABEL = 'Escrever relato';

/** Invites the member to post while they have not posted today (Figma 17). */
function WritePrompt({ onWrite }: { onWrite: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 2,
        borderColor: colors.brand,
        backgroundColor: colors.card,
      }}
    >
      <Text type="h3">O que você fez offline hoje?</Text>
      <Text type="caption" variant="secondary">
        Um relato por dia, até 280 caracteres.
      </Text>
      <Button label={WRITE_LABEL} onPress={onWrite} />
    </View>
  );
}

function StoryCard({ story, today }: { story: Story; today: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.card,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      >
        <Avatar
          name={story.authorName}
          tone={story.isMine ? 'brand' : 'accent'}
        />
        <View style={{ flex: 1 }}>
          <Text type="bodyStrong">{story.authorName}</Text>
          <Text type="caption" variant="secondary">
            {formatStoryDay(story.day, today)}
          </Text>
        </View>
      </View>
      <Text>{story.body}</Text>
      {story.isMine ? (
        <ReceivedReactions kinds={story.receivedKinds} />
      ) : (
        // Keyed by the loaded reaction so a reload resets the local selection.
        <ReactionBar
          key={`${story.id}:${story.myReaction ?? 'none'}`}
          storyId={story.id}
          initial={story.myReaction}
        />
      )}
    </View>
  );
}

function EndMarker() {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
      }}
    >
      <Ring size={32} filled={0} sage />
      <Text type="h3" variant="secondary">
        você chegou ao fim
      </Text>
    </View>
  );
}

// Finite feed (AD-005): the window is bounded, so every item renders at once
// and the list always ends with the end marker. No counters anywhere.
export function StoriesView({ circleId, onWrite }: StoriesViewProps) {
  const repo = useDependency(storyRepositoryToken);
  const { colors, spacing } = useTheme();
  const { state, reload } = useLoad(
    useCallback(
      () => repo.listByCircle(circleId, localDay()),
      [repo, circleId],
    ),
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
  if (state.data.length === 0) {
    // Figma 19: empty state plus the write action, no end marker.
    return (
      <View style={{ gap: spacing.md }}>
        <EmptyState
          title="Ninguém compartilhou ainda"
          body="Seja o primeiro a contar o que fez fora da tela hoje."
        />
        <Button label={WRITE_LABEL} onPress={onWrite} />
      </View>
    );
  }
  const today = localDay();
  return (
    // The circle shell already scrolls; the list only lays out the items.
    <FlatList
      data={state.data}
      keyExtractor={(story) => story.id}
      renderItem={({ item }) => <StoryCard story={item} today={today} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md }}>
          {sharedToday(state.data, today) ? (
            <AlreadySharedNotice />
          ) : (
            <WritePrompt onWrite={onWrite} />
          )}
        </View>
      }
      ListFooterComponent={EndMarker}
      initialNumToRender={state.data.length}
      scrollEnabled={false}
    />
  );
}
