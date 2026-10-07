import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native';

import { useDependency } from '@/core/di';
import { radius, useTheme } from '@/core/theme';
import { localDay } from '@/shared/date/local-day';
import { useAsyncAction } from '@/shared/hooks/use-async-action';
import { useLoad } from '@/shared/hooks/use-load';
import {
  Button,
  ErrorBanner,
  Header,
  ProgressRing,
  Reveal,
  Screen,
  Text,
} from '@/shared/ui';

import { pactRepositoryToken } from '../domain/pact-repository';
import { progressPercent } from '../domain/pact-use-cases';

export interface PactDetailScreenProps {
  pactId: string;
  currentUserId: string;
  onBack: () => void;
  onEdit: () => void;
}

export function PactDetailScreen({
  pactId,
  currentUserId,
  onBack,
  onEdit,
}: PactDetailScreenProps) {
  const repo = useDependency(pactRepositoryToken);
  const { colors, spacing } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const { state, reload } = useLoad(
    useCallback(() => repo.get(pactId, localDay()), [repo, pactId]),
  );
  const checkIn = useCallback(async () => {
    const result = await repo.checkIn(pactId, localDay());
    if (result.ok) await reload();
    return result;
  }, [repo, pactId, reload]);
  const remove = useCallback(async () => {
    const result = await repo.remove(pactId);
    if (result.ok) {
      setConfirming(false);
      onBack();
    }
    return result;
  }, [repo, pactId, onBack]);
  const checkInAction = useAsyncAction(checkIn);
  const removeAction = useAsyncAction(remove);

  const pact = state.status === 'ready' ? state.data : null;
  const mine = pact?.createdBy === currentUserId;

  return (
    <Screen>
      <Header
        title="Pacto"
        onBack={onBack}
        action={
          mine
            ? { icon: 'pencil', label: 'Editar pacto', onPress: onEdit }
            : undefined
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
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
        {pact ? (
          <>
            <Reveal style={{ gap: spacing.sm }}>
              <Text accessibilityRole="header" type="h1">
                {pact.title}
              </Text>
              {pact.description ? (
                <Text type="bodyLg" variant="secondary">
                  {pact.description}
                </Text>
              ) : null}
            </Reveal>
            <Reveal index={1}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.lg,
                  padding: spacing.lg,
                  borderRadius: radius.xl,
                  backgroundColor: colors.inverse,
                }}
              >
                <ProgressRing
                  percent={progressPercent(pact.doneCount, pact.memberCount)}
                />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text
                    type="label"
                    style={{ color: colors.onInverseSecondary }}
                  >
                    Hoje
                  </Text>
                  <Text type="numeral" style={{ color: colors.onInverse }}>
                    {`${pact.doneCount} de ${pact.memberCount}`}
                  </Text>
                  <Text
                    type="caption"
                    style={{ color: colors.onInverseSecondary }}
                  >
                    fizeram o check-in
                  </Text>
                </View>
              </View>
            </Reveal>
            <Text type="caption" variant="secondary">
              Mostramos só o total do grupo, nunca quem fez ou quem não fez.
            </Text>
            <View style={{ gap: spacing.sm }}>
              <ErrorBanner error={checkInAction.error} />
              <Button
                label={
                  pact.checkedInByMe ? 'Check-in feito hoje' : 'Fazer check-in'
                }
                disabled={pact.checkedInByMe}
                loading={checkInAction.pending}
                onPress={() => void checkInAction.run()}
              />
              {mine ? (
                <Button
                  label="Apagar pacto"
                  variant="ghost"
                  onPress={() => setConfirming(true)}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
      <Modal
        visible={confirming}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirming(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: spacing.xl,
          }}
        >
          {/* Scrim: brand at 60% opacity, as in Figma 13. */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.brand,
              opacity: 0.6,
            }}
          />
          <View
            accessibilityViewIsModal
            style={{
              gap: spacing.md,
              padding: spacing.lg,
              borderRadius: radius.xl,
              backgroundColor: colors.background,
            }}
          >
            <Text type="h2">Apagar este pacto?</Text>
            <Text variant="secondary">
              Os check-ins do pacto também serão apagados. Isso não pode ser
              desfeito.
            </Text>
            <ErrorBanner error={removeAction.error} />
            <View style={{ gap: spacing.sm }}>
              <Button
                label="Apagar"
                variant="destructive"
                loading={removeAction.pending}
                onPress={() => void removeAction.run()}
              />
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={() => setConfirming(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
