import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { localDay } from '@/shared/date/local-day';
import { useLoad } from '@/shared/hooks/use-load';
import {
  Button,
  EmptyState,
  ErrorBanner,
  Icon,
  ProgressBar,
  Reveal,
  Text,
} from '@/shared/ui';

import { pactRepositoryToken } from '../domain/pact-repository';
import { progressPercent } from '../domain/pact-use-cases';

export interface PactsViewProps {
  circleId: string;
  onOpenPact: (pactId: string) => void;
  onCreate: () => void;
}

export function PactsView({ circleId, onOpenPact, onCreate }: PactsViewProps) {
  const repo = useDependency(pactRepositoryToken);
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
    return (
      <View style={{ gap: spacing.md }}>
        <EmptyState
          title="Nenhum pacto ainda"
          body="Combinem algo que o círculo todo consiga cumprir, todo dia."
        />
        <Button label="Criar pacto" onPress={onCreate} />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      {state.data.map((pact, index) => {
        const percent = progressPercent(pact.doneCount, pact.memberCount);
        return (
          <Reveal key={pact.id} index={index}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={pact.title}
              onPress={() => onOpenPact(pact.id)}
              style={({ pressed }) => ({
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: colors.card,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Text type="h3" style={{ flex: 1 }}>
                  {pact.title}
                </Text>
                {pact.checkedInByMe ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.full,
                      backgroundColor: colors.brand,
                    }}
                  >
                    <Icon name="check" size={14} color={colors.onBrand} />
                    <Text
                      type="captionStrong"
                      style={{ color: colors.onBrand }}
                    >
                      Feito hoje
                    </Text>
                  </View>
                ) : null}
              </View>
              {pact.description ? (
                <Text variant="secondary">{pact.description}</Text>
              ) : null}
              <View style={{ gap: spacing.sm }}>
                <ProgressBar percent={percent} />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text type="captionStrong">
                    {`${pact.doneCount} de ${pact.memberCount} hoje`}
                  </Text>
                  <Text
                    type="caption"
                    variant="secondary"
                  >{`${percent}%`}</Text>
                </View>
              </View>
            </Pressable>
          </Reveal>
        );
      })}
    </View>
  );
}
