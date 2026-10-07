import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { useLoad } from '@/shared/hooks/use-load';
import {
  Button,
  EmptyState,
  ErrorBanner,
  Header,
  Icon,
  Ring,
  Screen,
  Text,
} from '@/shared/ui';

import {
  circleRepositoryToken,
  MAX_CIRCLE_MEMBERS,
} from '../domain/circle-repository';
import type { Circle } from '../domain/circle-repository';

export interface CirclesListScreenProps {
  userName: string;
  onOpen: (circle: Circle) => void;
  onCreate: () => void;
  onJoin: () => void;
}

export function CirclesListScreen({
  userName,
  onOpen,
  onCreate,
  onJoin,
}: CirclesListScreenProps) {
  const repo = useDependency(circleRepositoryToken);
  const { colors, spacing } = useTheme();
  const { state, reload } = useLoad(useCallback(() => repo.listMine(), [repo]));
  const isEmpty = state.status === 'ready' && state.data.length === 0;
  const firstName = userName.trim().split(/\s+/)[0] ?? '';

  return (
    <Screen>
      <Header
        title="Círculos"
        action={
          isEmpty
            ? undefined
            : { icon: 'plus', label: 'Criar círculo', onPress: onCreate }
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {state.status === 'loading' ? (
          <ActivityIndicator
            accessibilityLabel="Carregando"
            color={colors.accent}
          />
        ) : null}
        {state.status === 'error' ? (
          <ErrorBanner error={state.error} onRetry={() => void reload()} />
        ) : null}
        {isEmpty ? (
          <>
            <EmptyState
              title="Comece pelo seu círculo"
              body="Crie um círculo ou entre com o código que um amigo te passou."
              accentDots={5}
            />
            <Button label="Criar círculo" onPress={onCreate} />
            <Button
              label="Entrar com código"
              variant="secondary"
              onPress={onJoin}
            />
          </>
        ) : null}
        {state.status === 'ready' && state.data.length > 0 ? (
          <>
            <Text variant="secondary">
              {`Olá, ${firstName}. Com quem você está largando a tela?`}
            </Text>
            {state.data.map((circle) => (
              <Pressable
                key={circle.id}
                accessibilityRole="button"
                accessibilityLabel={circle.name}
                onPress={() => onOpen(circle)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ring size={64} filled={circle.memberCount} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text type="h3">{circle.name}</Text>
                  <Text type="caption" variant="secondary">
                    {`${circle.memberCount} de ${MAX_CIRCLE_MEMBERS} membros`}
                  </Text>
                </View>
                <Icon name="chevron" size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
            <Button
              label="Entrar com código"
              variant="secondary"
              onPress={onJoin}
            />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
