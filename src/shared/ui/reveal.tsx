import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface RevealProps {
  children: ReactNode;
  /** Position in a list; each step delays the entrance by 70 ms. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

// Native entrance: fade and rise. The web build swaps this for GSAP (reveal.web.tsx).
export function Reveal({ children, index = 0, style }: RevealProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 8) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
