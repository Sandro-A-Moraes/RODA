import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { Text } from '@/shared/ui';

import { DotRing } from './components/dot-ring';

// Figma 21 (29:748): forest background, 12-dot ring, wordmark, no status bar.
export function SplashScreen() {
  const { colors, spacing, typography } = useTheme();
  const fills = Array.from({ length: 12 }, (_, i) =>
    i === 0
      ? colors.accent
      : i % 3 === 0
        ? colors.onInverseSecondary
        : colors.inverseTrack,
  );
  return (
    <View
      accessible
      accessibilityLabel="Roda. Carregando"
      style={[
        styles.fill,
        { backgroundColor: colors.inverse, gap: spacing.lg },
      ]}
    >
      <StatusBar hidden />
      <DotRing size={200} dotRadius={9} fills={fills} testID="splash-ring" />
      <Text
        type="display"
        style={{
          color: colors.onInverse,
          fontSize: typography.sizes.wordmark,
          lineHeight: 68,
          letterSpacing: -0.64,
        }}
      >
        Roda
      </Text>
      <Text
        type="bodyLg"
        style={{ color: colors.onInverseSecondary, textAlign: 'center' }}
      >
        Menos tela. Mais roda.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
