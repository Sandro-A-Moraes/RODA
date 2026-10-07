import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { useDependency } from '@/core/di';
import { localDay } from '@/shared/date/local-day';
import { useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { Button, ErrorBanner, Header, Screen, TextField } from '@/shared/ui';

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
  const { spacing } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!pactId) return;
    void repo.get(pactId, localDay()).then((result) => {
      if (result.ok) {
        setTitle(result.value.title);
        setDescription(result.value.description);
      }
    });
  }, [repo, pactId]);

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
          helper="Até 280 caracteres."
          multiline
          style={{ minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }}
        />
        <ErrorBanner error={otherError} />
        <Button
          label={pactId ? 'Salvar pacto' : 'Criar pacto'}
          loading={pending}
          onPress={() => void run()}
        />
      </ScrollView>
    </Screen>
  );
}
