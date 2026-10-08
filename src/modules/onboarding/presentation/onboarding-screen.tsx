import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { radius, useTheme } from '@/core/theme';
import { Avatar, Button, Card, Icon, Screen, Text } from '@/shared/ui';

import { DotRing } from './components/dot-ring';
import { useOnboarding } from './onboarding-provider';

export type OnboardingDestination = 'register' | 'sign-in';

export interface OnboardingScreenProps {
  /** Called on "Pular", "Começar" or "Já tenho conta"; the same press stores the flag. */
  onExit: (destination: OnboardingDestination) => void;
}

interface Page {
  title: string;
  body: string;
  illustration: () => ReactNode;
}

const PAGES: readonly Page[] = [
  {
    title: 'Um círculo pequeno, de gente que você conhece.',
    body: 'No Roda não há seguidores nem perfil público. São no máximo 12 pessoas próximas.',
    illustration: () => <CircleIllustration />,
  },
  {
    title: 'Combinem um pacto e cumpram juntos.',
    body: 'Todo dia cada pessoa faz o check-in. O círculo vê o progresso do grupo, nunca um ranking.',
    illustration: () => <PactIllustration />,
  },
  {
    title: 'Um relato por dia. Depois, o encontro.',
    body: 'Conte o que fez fora da tela, reaja sem curtidas e marque um encontro de verdade.',
    illustration: () => <StoryIllustration />,
  },
];

// Figma 22-24 (29:765, 29:807, 29:840): one screen with a page index.
export function OnboardingScreen({ onExit }: OnboardingScreenProps) {
  const { colors, spacing } = useTheme();
  const { markSeen } = useOnboarding();
  const [index, setIndex] = useState(0);
  const page = PAGES[index];
  const isLast = index === PAGES.length - 1;

  // System back (Android) on page 2 or 3 goes to the previous page; on page 1
  // nothing is registered, so the platform default leaves the app. A no-op on
  // web (ONB-03 AC9-10).
  useEffect(() => {
    if (index === 0) return undefined;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setIndex(index - 1);
        return true;
      },
    );
    return () => subscription.remove();
  }, [index]);

  // Both calls run in one press handler, so React commits the route change
  // and the flag's status update together: the guard that drops the
  // onboarding route never renders before the destination is chosen. The
  // order of the two calls is not observable.
  const exit = (destination: OnboardingDestination) => {
    onExit(destination);
    markSeen();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          gap: spacing.lg,
        }}
      >
        <View style={styles.skip}>
          {isLast ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pular"
              onPress={() => exit('register')}
              hitSlop={8}
              style={styles.skipButton}
            >
              <Text type="captionStrong" style={{ color: colors.accent }}>
                Pular
              </Text>
            </Pressable>
          )}
        </View>
        <View
          testID="onboarding-illustration"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.illustration}
        >
          {page.illustration()}
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text type="h1">{page.title}</Text>
          <Text variant="secondary">{page.body}</Text>
        </View>
        <View style={styles.spacer} />
        <PageIndicator current={index} total={PAGES.length} />
        <View style={{ gap: spacing.sm }}>
          {isLast ? (
            <>
              <Button label="Começar" onPress={() => exit('register')} />
              <Button
                label="Já tenho conta"
                variant="ghost"
                onPress={() => exit('sign-in')}
              />
            </>
          ) : (
            <Button label="Continuar" onPress={() => setIndex(index + 1)} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function PageIndicator({ current, total }: { current: number; total: number }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Página ${current + 1} de ${total}`}
      style={[styles.indicator, { gap: spacing.sm }]}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={`page-dot-${i + 1}`}
          style={{
            width: i === current ? 28 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.accent : colors.decorative,
          }}
        />
      ))}
    </View>
  );
}

function CircleIllustration() {
  const { colors } = useTheme();
  const fills = Array.from({ length: 12 }, (_, i) =>
    i === 0 ? colors.accent : i % 2 === 1 ? colors.brand : colors.decorative,
  );
  return (
    <View style={styles.ringBox}>
      <DotRing
        size={260}
        dotRadius={12}
        fills={fills}
        testID="onboarding-ring"
      />
      <View style={styles.ringCenter}>
        <Text type="numeral">12</Text>
        <Text type="caption" variant="secondary">
          pessoas, no máximo
        </Text>
      </View>
    </View>
  );
}

function PactIllustration() {
  const { colors, spacing } = useTheme();
  const size = 180;
  const stroke = 14.4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.xl,
        backgroundColor: colors.inverse,
      }}
    >
      <View style={[styles.center, { width: size, height: size }]}>
        <Svg
          width={size}
          height={size}
          style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.inverseTrack}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.onInverseSecondary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - 5 / 7)}
          />
        </Svg>
        <Text type="h1" style={{ color: colors.onInverse }}>
          5 de 7
        </Text>
      </View>
      <Text
        type="caption"
        style={{ color: colors.onInverseSecondary, textAlign: 'center' }}
      >
        fizeram o check-in hoje
      </Text>
    </View>
  );
}

function StoryIllustration() {
  const { spacing } = useTheme();
  return (
    <View style={{ width: '100%', gap: spacing.sm }}>
      <Card style={{ gap: spacing.md }}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <Avatar name="Beto Lima" tone="accent" />
          <View style={styles.spacer}>
            <Text type="bodyStrong">Beto Lima</Text>
            <Text type="caption" variant="secondary">
              ontem
            </Text>
          </View>
        </View>
        <Text type="bodyLg">
          Jantar em família sem tela. A conversa rendeu até tarde.
        </Text>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <SampleChip label="Estou com você" selected />
          <SampleChip label="Me inspirou" />
        </View>
      </Card>
      <Text type="h3" variant="secondary" style={{ textAlign: 'center' }}>
        você chegou ao fim
      </Text>
    </View>
  );
}

// Looks like the shared Chip but is a plain view: the illustration offers no
// interaction, so it must not render a focusable Pressable (ONB-03 AC8).
function SampleChip({
  label,
  selected = false,
}: {
  label: string;
  selected?: boolean;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        styles.sampleChip,
        {
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: selected ? colors.brand : 'transparent',
          borderWidth: selected ? 0 : 1,
          borderColor: colors.border,
        },
      ]}
    >
      {selected ? <Icon name="check" color={colors.onBrand} size={16} /> : null}
      <Text
        type="captionStrong"
        style={{ color: selected ? colors.onBrand : colors.textPrimary }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skip: { height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipButton: { minHeight: 44, justifyContent: 'center' },
  illustration: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  sampleChip: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
  },
  spacer: { flex: 1 },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBox: { width: 260, height: 260 },
  ringCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
