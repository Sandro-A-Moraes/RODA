import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { Text } from '@/shared/ui';

import { DotRing } from './components/dot-ring';
import { USE_NATIVE_DRIVER, useReducedMotion } from './use-reduced-motion';

// Figma 21 (29:748): forest background, 12-dot ring, wordmark, no status bar.
// The ring fades and scales in, then the words fade and rise in (ONB-06 AC1).
export function SplashScreen() {
  const { colors, spacing, typography } = useTheme();
  const reduceMotion = useReducedMotion();
  const [ring] = useState(() => new Animated.Value(0));
  const [words] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      ring.setValue(1);
      words.setValue(1);
      return undefined;
    }
    const enter = (value: Animated.Value, duration: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
    const entrance = Animated.stagger(160, [
      enter(ring, 520),
      enter(words, 460),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [reduceMotion, ring, words]);

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
      <Animated.View
        style={{
          opacity: ring,
          transform: [
            {
              scale: ring.interpolate({
                inputRange: [0, 1],
                outputRange: [0.88, 1],
              }),
            },
          ],
        }}
      >
        <DotRing size={200} dotRadius={9} fills={fills} testID="splash-ring" />
      </Animated.View>
      <Animated.View
        style={[
          styles.words,
          {
            gap: spacing.lg,
            opacity: words,
            transform: [
              {
                translateY: words.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  words: { alignItems: 'center' },
});
