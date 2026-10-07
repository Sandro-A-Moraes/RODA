import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useDependency } from '@/core/di';
import { mapError } from '@/core/errors';
import type { AppError } from '@/core/errors';
import { radius, useTheme } from '@/core/theme';
import { localDay } from '@/shared/date/local-day';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import {
  Button,
  ErrorBanner,
  Header,
  Ring,
  Screen,
  Text,
  TextField,
} from '@/shared/ui';

import { pactRepositoryToken } from '../domain/pact-repository';
import { createPact, updatePact } from '../domain/pact-use-cases';

export interface PactFormScreenProps {
  circleId: string;
  /** When set the form edits this pact instead of creating one. */
  pactId?: string;
  onBack: () => void;
  onSaved: () => void;
}

export function PactFormScreen({
  circleId,
  pactId,
  onBack,
  onSaved,
}: PactFormScreenProps) {
  const repo = useDependency(pactRepositoryToken);
  const { colors, spacing } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loadError, setLoadError] = useState<AppError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!pactId) return;
    let active = true;
    repo
      .get(pactId, localDay())
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setLoadError(null);
          setTitle(result.value.title);
          setDescription(result.value.description);
        } else {
          setLoadError(result.error);
        }
      })
      .catch((thrown: unknown) => {
        if (active) setLoadError(mapError(thrown));
      });
    return () => {
      active = false;
    };
  }, [repo, pactId, attempt]);

  const save = useCallback(async () => {
    const input = { title, description };
    const result = pactId
      ? await updatePact(repo, pactId, input)
      : await createPact(repo, circleId, input);
    if (result.ok) onSaved();
    return result;
  }, [repo, pactId, circleId, title, description, onSaved]);
  const { run, pending, error } = useAsyncAction(save);

  const titleError =
    error?.code === 'validation' && error.message.startsWith('Título')
      ? error.message
      : undefined;
  const descriptionError =
    error?.code === 'validation' && error.message.startsWith('Descrição')
      ? error.message
      : undefined;
  const otherError = titleError || descriptionError ? null : error;

  return (
    <Screen>
      <Header title={pactId ? 'Editar pacto' : 'Novo pacto'} onBack={onBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {loadError ? (
          <ErrorBanner
            error={loadError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : (
          <>
            <TextField
              label="Título"
              value={title}
              onChangeText={setTitle}
              error={titleError}
              helper="De 3 a 60 caracteres."
            />
            <TextField
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              error={descriptionError}
              helper={`${description.length} de 280 caracteres`}
              multiline
              style={{
                minHeight: 96,
                paddingTop: 12,
                textAlignVertical: 'top',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: colors.card,
              }}
            >
              <Ring size={64} filled={7} />
              <Text style={{ flex: 1 }}>
                Escolha algo que o círculo inteiro consiga cumprir todo dia.
              </Text>
            </View>
            <ErrorBanner error={otherError} />
            <Button
              label={pactId ? 'Salvar pacto' : 'Criar pacto'}
              loading={pending}
              onPress={() => void run()}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
