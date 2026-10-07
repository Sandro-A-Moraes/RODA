import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { radius, useTheme } from '@/core/theme';

export interface ProgressBarProps {
  /** 0 to 100. */
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));
  const [width] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(width, {
      toValue: clamped,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, width]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{
        height: 8,
        borderRadius: radius.full,
        backgroundColor: colors.track,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.accent,
          width: width.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}
