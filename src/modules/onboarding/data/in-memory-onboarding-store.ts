import type { OnboardingStore } from '../domain/onboarding-store';

export class InMemoryOnboardingStore implements OnboardingStore {
  constructor(private seen = false) {}

  async hasSeen(): Promise<boolean> {
    return this.seen;
  }

  async markSeen(): Promise<void> {
    this.seen = true;
  }
}
