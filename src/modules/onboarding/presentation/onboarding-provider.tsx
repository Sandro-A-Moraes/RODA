import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { useDependency } from '@/core/di';

import { onboardingStoreToken } from '../domain/onboarding-store';

export type OnboardingStatus = 'loading' | 'unseen' | 'seen';

export interface Onboarding {
  status: OnboardingStatus;
  /** Stores the flag; the status is `seen` at once even if the write fails. */
  markSeen: () => void;
}

const OnboardingContext = createContext<Onboarding | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const store = useDependency(onboardingStoreToken);
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let active = true;
    // A failed read counts as seen: never trap the user in onboarding.
    store.hasSeen().then(
      (seen) => {
        if (active) setStatus(seen ? 'seen' : 'unseen');
      },
      () => {
        if (active) setStatus('seen');
      },
    );
    return () => {
      active = false;
    };
  }, [store]);

  const markSeen = useCallback(() => {
    setStatus('seen');
    // A failed write is ignored: the user already chose where to go.
    store.markSeen().catch(() => undefined);
  }, [store]);

  return (
    <OnboardingContext.Provider value={{ status, markSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): Onboarding {
  const onboarding = useContext(OnboardingContext);
  if (!onboarding) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return onboarding;
}
