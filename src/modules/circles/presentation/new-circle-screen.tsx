import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useDependency } from '@/core/di';
import { useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { Button, Header, Screen, Text, TextField } from '@/shared/ui';

import { circleRepositoryToken } from '../domain/circle-repository';
import type { Circle } from '../domain/circle-repository';
import { createCircle } from '../domain/circle-use-cases';

export interface NewCircleScreenProps {
  onBack: () => void;
  onCreated: (circle: Circle) => void;
}

export function NewCircleScreen({ onBack, onCreated }: NewCircleScreenProps) {
  const repo = useDependency(circleRepositoryToken);
  const { spacing } = useTheme();
  const [name, setName] = useState('');
  const create = useCallback(
    async (value: string) => {
      const result = await createCircle(repo, value);
      if (result.ok) onCreated(result.value);
      return result;
    },
    [repo, onCreated],
  );
  const { run, pending, error } = useAsyncAction(create);
  const fieldError =
    error?.code === 'validation' ? error.message : undefined;

  return (
    <Screen>
      <Header title="Novo círculo" onBack={onBack} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text type="bodyLg" variant="secondary">
          Dê um nome ao grupo. Depois você recebe um código para convidar até 11
          pessoas.
        </Text>
        <TextField
          label="Nome do círculo"
          value={name}
          onChangeText={setName}
          error={fieldError}
          helper="De 2 a 40 caracteres."
          maxLength={60}
        />
        {error && !fieldError ? (
          <Text accessibilityRole="alert" type="captionStrong">
            {error.message}
          </Text>
        ) : null}
        <Button
          label="Criar círculo"
          loading={pending}
          onPress={() => void run(name)}
        />
      </View>
    </Screen>
  );
}
