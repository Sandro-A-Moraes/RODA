import { useCallback, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { Button, Header, Icon, Screen, Text } from '@/shared/ui';

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
  const { colors, spacing } = useTheme();
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
          <View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
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
                    borderColor: error
                      ? colors.accent
                      : i === code.length
                        ? colors.brand
                        : colors.card,
                  }}
                >
                  <Text type="h2">{code[i] ?? ''}</Text>
                </View>
              ))}
            </View>
            <TextInput
              ref={inputRef}
              accessibilityLabel="Código de convite"
              value={code}
              onChangeText={(text) =>
                setCode(
                  text.replace(/\s/g, '').toUpperCase().slice(0, CODE_LENGTH),
                )
              }
              autoCapitalize="characters"
              autoCorrect={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
              }}
            />
          </View>
          {error ? (
            <View
              accessibilityRole="alert"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <Icon name="alert" size={16} color={colors.accent} />
              <Text type="captionStrong" style={{ color: colors.accent }}>
                {error.message}
              </Text>
            </View>
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
