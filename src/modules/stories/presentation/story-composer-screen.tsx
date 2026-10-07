import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { useDependency } from '@/core/di';
import { useTheme } from '@/core/theme';
import { localDay } from '@/shared/date/local-day';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { useLoad } from '@/shared/hooks/use-load';
import {
  Button,
  ErrorBanner,
  Header,
  Screen,
  Text,
  TextField,
} from '@/shared/ui';

import { storyRepositoryToken } from '../domain/story-repository';
import { createStory } from '../domain/story-use-cases';
import { STORY_MAX_LENGTH } from '../domain/story-validation';
import { AlreadySharedNotice, sharedToday } from './stories-view';

export interface StoryComposerScreenProps {
  circleId: string;
  onBack: () => void;
  onSaved: () => void;
}

const QUESTION = 'O que você fez offline hoje?';

// Figma 14: one story per day; the composer becomes a notice once posted.
export function StoryComposerScreen({
  circleId,
  onBack,
  onSaved,
}: StoryComposerScreenProps) {
  const repo = useDependency(storyRepositoryToken);
  const { colors, spacing } = useTheme();
  const [body, setBody] = useState('');
  const { state, reload } = useLoad(
    useCallback(
      () => repo.listByCircle(circleId, localDay()),
      [repo, circleId],
    ),
  );

  // The day is read at submit time, so a rollover while typing counts.
  const save = useCallback(async () => {
    const result = await createStory(repo, circleId, body, localDay());
    if (result.ok) onSaved();
    // Posted elsewhere meanwhile: reload so the notice replaces the form.
    else if (result.error.code === 'conflict') void reload();
    return result;
  }, [repo, circleId, body, onSaved, reload]);
  const { run, pending, error } = useAsyncAction(save);

  const fieldError = error?.code === 'validation' ? error.message : undefined;
  const otherError = fieldError ? null : error;

  let content;
  if (state.status === 'loading') {
    content = (
      <ActivityIndicator
        accessibilityLabel="Carregando"
        color={colors.accent}
      />
    );
  } else if (state.status === 'error') {
    content = <ErrorBanner error={state.error} onRetry={() => void reload()} />;
  } else if (sharedToday(state.data, localDay())) {
    content = <AlreadySharedNotice />;
  } else {
    content = (
      <>
        <Text type="h2">{QUESTION}</Text>
        <View style={{ gap: spacing.xs }}>
          <TextField
            label="Seu relato"
            value={body}
            onChangeText={setBody}
            error={fieldError}
            multiline
            style={{ minHeight: 160, paddingTop: 12, textAlignVertical: 'top' }}
          />
          <Text
            type="caption"
            variant="secondary"
            style={{ textAlign: 'right' }}
          >
            {`${body.length} de ${STORY_MAX_LENGTH}`}
          </Text>
        </View>
        <Text type="caption" variant="secondary">
          Um relato por dia. Ele fica visível só para o seu círculo.
        </Text>
        <ErrorBanner error={otherError} />
        <Button
          label="Compartilhar"
          loading={pending}
          onPress={() => void run()}
        />
      </>
    );
  }

  return (
    <Screen>
      <Header title="Novo relato" onBack={onBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {content}
      </ScrollView>
    </Screen>
  );
}
