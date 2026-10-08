import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { RootNavigator, useSession } from '@/modules/auth';

import { useOnboarding } from './onboarding-provider';
import { SplashScreen } from './splash-screen';
import { USE_NATIVE_DRIVER, useReducedMotion } from './use-reduced-motion';

export const SPLASH_MINIMUM_MS = 1200;
/** How long the splash takes to fade out over the landing route. */
export const SPLASH_EXIT_MS = 280;

export interface LaunchNavigatorProps {
  /** Minimum time the splash stays up; tests pass 0. */
  minSplashMs?: number;
}

// Composes the auth RootNavigator with the launch flow (AD-008): splash on
// every launch, onboarding only for a signed-out user on a fresh device.
// The splash is an overlay owned here, so one instance lives through the whole
// launch: the navigator stays held (renders nothing) until everything is known,
// then the landing route mounts under the splash and the splash fades away.
export function LaunchNavigator({
  minSplashMs = SPLASH_MINIMUM_MS,
}: LaunchNavigatorProps) {
  const { status: session } = useSession();
  const { status: onboarding, markSeen } = useOnboarding();
  const [minimumElapsed, setMinimumElapsed] = useState(minSplashMs <= 0);
  const [splashGone, setSplashGone] = useState(false);
  const ready =
    session !== 'loading' && onboarding !== 'loading' && minimumElapsed;
  const dropSplash = useCallback(() => setSplashGone(true), []);

  useEffect(() => {
    if (minSplashMs <= 0) return;
    const id = setTimeout(() => setMinimumElapsed(true), minSplashMs);
    return () => clearTimeout(id);
  }, [minSplashMs]);

  // Someone who signs in on this device does not need onboarding after a sign-out.
  useEffect(() => {
    if (session === 'signedIn' && onboarding === 'unseen') markSeen();
  }, [session, onboarding, markSeen]);

  return (
    <View style={styles.fill}>
      <RootNavigator
        holdSplash={!ready}
        showOnboarding={onboarding === 'unseen'}
      />
      {splashGone ? null : (
        <SplashOverlay leaving={ready} onGone={dropSplash} />
      )}
    </View>
  );
}

function SplashOverlay({
  leaving,
  onGone,
}: {
  leaving: boolean;
  onGone: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!leaving) return undefined;
    if (reduceMotion) {
      onGone();
      return undefined;
    }
    const fade = Animated.timing(opacity, {
      toValue: 0,
      duration: SPLASH_EXIT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    fade.start(({ finished }) => {
      if (finished) onGone();
    });
    return () => fade.stop();
  }, [leaving, reduceMotion, opacity, onGone]);

  return (
    <Animated.View
      testID="splash-overlay"
      style={[
        StyleSheet.absoluteFill,
        { opacity, pointerEvents: leaving ? 'none' : 'auto' },
      ]}
    >
      <SplashScreen />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
