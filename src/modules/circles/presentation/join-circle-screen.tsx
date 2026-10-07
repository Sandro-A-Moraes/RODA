import { useCallback, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { Button, Header, Screen, Text } from '@/shared/ui';

import { circleRepositoryToken } from '../domain/circle-repository';
import type { Circle } from '../domain/circle-repository';
import { joinCircle } from '../domain/circle-use-cases';

const CODE_LENGTH = 6;

export interface JoinCircleScreenProps {
  onBack: () => void;
  onJoined: (circle: Circle) => void;
}

export function JoinCircleScreen({ onBack, onJoined }: JoinCircleScreenProps) {
  const repo = useDependency(circleRepositoryToken);
  const { colors, spacing, typography } = useTheme();
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const join = useCallback(
    async (value: string) => {
      const result = await joinCircle(repo, value);
      if (result.ok) onJoined(result.value);
      return result;
    },
    [repo, onJoined],
  );
  const { run, pending, error } = useAsyncAction(join);

  return (
    <Screen>
      <Header title="Entrar com código" onBack={onBack} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text type="bodyLg" variant="secondary">
          Peça o código de 6 caracteres para quem criou o círculo.
        </Text>
        <View style={{ gap: spacing.sm }}>
          <Pressable
            accessible={false}
            onPress={() => inputRef.current?.focus()}
            style={{ flexDirection: 'row', gap: spacing.sm }}
          >
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor:
                    error || i === code.length ? colors.accent : colors.card,
                }}
              >
                <Text type="h2">{code[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={inputRef}
            accessibilityLabel="Código de convite"
            value={code}
            onChangeText={(text) =>
              setCode(text.replace(/\s/g, '').toUpperCase().slice(0, CODE_LENGTH))
            }
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            style={{
              height: 44,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              color: colors.textPrimary,
              fontFamily: typography.fonts.body,
            }}
            placeholder="Digite o código"
            placeholderTextColor={colors.textSecondary}
          />
          {error ? (
            <Text
              accessibilityRole="alert"
              type="captionStrong"
              style={{ color: colors.accent }}
            >
              {error.message}
            </Text>
          ) : null}
        </View>
        <Text type="caption" variant="secondary">
          O código não diferencia maiúsculas de minúsculas.
        </Text>
        <Button
          label="Entrar no círculo"
          loading={pending}
          onPress={() => void run(code)}
        />
      </View>
    </Screen>
  );
}
