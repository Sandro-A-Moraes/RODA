import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/core/theme';

import { Text } from './text';

export interface ProgressRingProps {
  /** 0 to 100. */
  percent: number;
  size?: number;
}

// Collective progress ring shown on the dark pact card (Figma 11).
export function ProgressRing({ percent, size = 112 }: ProgressRingProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(0);

  // Plain state instead of an animated SVG component: the animated wrapper
  // leaks `collapsable` to the DOM on web.
  useEffect(() => {
    const id = progress.addListener(({ value }) => setShown(value));
    return () => progress.removeListener(id);
  }, [progress]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, progress]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.inverseTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.onInverseSecondary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - shown / 100)}
        />
      </Svg>
      <Text type="h2" style={{ color: colors.onInverse }}>
        {`${clamped}%`}
      </Text>
    </View>
  );
}
