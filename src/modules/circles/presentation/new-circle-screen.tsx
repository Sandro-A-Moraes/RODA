import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { Button, Header, Ring, Screen, Text, TextField } from '@/shared/ui';

import { circleRepositoryToken } from '../domain/circle-repository';
import type { Circle } from '../domain/circle-repository';
import { createCircle } from '../domain/circle-use-cases';

export interface NewCircleScreenProps {
  onBack: () => void;
  onCreated: (circle: Circle) => void;
}

export function NewCircleScreen({ onBack, onCreated }: NewCircleScreenProps) {
  const repo = useDependency(circleRepositoryToken);
  const { colors, spacing } = useTheme();
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
  const fieldError = error?.code === 'validation' ? error.message : undefined;

  return (
    <Screen>
      <Header title="Novo círculo" onBack={onBack} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <TextField
          label="Nome do círculo"
          value={name}
          onChangeText={setName}
          error={fieldError}
          helper="Entre 2 e 40 caracteres"
          maxLength={60}
        />
        {error && !fieldError ? (
          <Text accessibilityRole="alert" type="captionStrong">
            {error.message}
          </Text>
        ) : null}
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
            Até 12 pessoas que você conhece. Depois de criar, você recebe um
            código para convidar.
          </Text>
        </View>
        <Button
          label="Criar círculo"
          loading={pending}
          onPress={() => void run(name)}
        />
      </View>
    </Screen>
  );
}
