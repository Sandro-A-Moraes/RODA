import { useEffect, useState } from 'react';

import { RootNavigator, useSession } from '@/modules/auth';

import { useOnboarding } from './onboarding-provider';
import { SplashScreen } from './splash-screen';

export const SPLASH_MINIMUM_MS = 1200;

export interface LaunchNavigatorProps {
  /** Minimum time the splash stays up; tests pass 0. */
  minSplashMs?: number;
}

// Composes the auth RootNavigator with the launch flow (AD-008): splash on
// every launch, onboarding only for a signed-out user on a fresh device.
export function LaunchNavigator({
  minSplashMs = SPLASH_MINIMUM_MS,
}: LaunchNavigatorProps) {
  const { status: session } = useSession();
  const { status: onboarding, markSeen } = useOnboarding();
  const [minimumElapsed, setMinimumElapsed] = useState(minSplashMs <= 0);

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
    <RootNavigator
      splash={<SplashScreen />}
      holdSplash={onboarding === 'loading' || !minimumElapsed}
      showOnboarding={onboarding === 'unseen'}
    />
  );
}
