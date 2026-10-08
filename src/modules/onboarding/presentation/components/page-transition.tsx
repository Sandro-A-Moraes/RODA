import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { USE_NATIVE_DRIVER, useReducedMotion } from '../use-reduced-motion';

const SLIDE = 24;

export interface PageTransitionProps {
  /** Changing it plays the transition; the content is already the new page. */
  pageKey: number;
  /** 1 going forward (enters from the right), -1 going back, 0 fade only. */
  direction: 1 | -1 | 0;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

// The page swaps at once and fades in with a short slide in the direction of
// travel, so no action ever waits for the animation (ONB-06 AC4-6).
export function PageTransition({
  pageKey,
  direction,
  style,
  children,
}: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      offset.setValue(0);
      return undefined;
    }
    progress.setValue(0);
    offset.setValue(direction * SLIDE);
    const config = {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    };
    const enter = Animated.parallel([
      Animated.timing(progress, config),
      Animated.timing(offset, { ...config, toValue: 0 }),
    ]);
    enter.start();
    return () => enter.stop();
    // `direction` is read only when the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, reduceMotion, progress, offset]);

  return (
    <Animated.View
      testID="onboarding-page"
      style={[
        style,
        { opacity: progress, transform: [{ translateX: offset }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
