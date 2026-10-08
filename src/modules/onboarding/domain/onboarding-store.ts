import { createToken } from '@/core/di';
import type { Token } from '@/core/di';

/** Device-local flag: has this device already gone through onboarding? */
export interface OnboardingStore {
  hasSeen(): Promise<boolean>;
  markSeen(): Promise<void>;
}

export const onboardingStoreToken: Token<OnboardingStore> =
  createToken<OnboardingStore>('OnboardingStore');
