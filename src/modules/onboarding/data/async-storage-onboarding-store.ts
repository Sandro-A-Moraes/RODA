import type { OnboardingStore } from '../domain/onboarding-store';

export const ONBOARDING_SEEN_KEY = 'roda.onboarding.seen';

/** The subset of AsyncStorage the store needs (localStorage under it on web). */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

// The storage is injected: AsyncStorage throws at import under Jest, so only
// app/_layout.tsx imports it.
export class AsyncStorageOnboardingStore implements OnboardingStore {
  constructor(private readonly storage: KeyValueStorage) {}

  async hasSeen(): Promise<boolean> {
    return (await this.storage.getItem(ONBOARDING_SEEN_KEY)) === 'true';
  }

  async markSeen(): Promise<void> {
    await this.storage.setItem(ONBOARDING_SEEN_KEY, 'true');
  }
}
