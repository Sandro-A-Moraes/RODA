import { InMemoryOnboardingStore } from '../data/in-memory-onboarding-store';

describe('InMemoryOnboardingStore', () => {
  it('reports unseen on a fresh device', async () => {
    expect(await new InMemoryOnboardingStore().hasSeen()).toBe(false);
  });

  it('reports seen after markSeen', async () => {
    const store = new InMemoryOnboardingStore();
    await store.markSeen();
    expect(await store.hasSeen()).toBe(true);
  });

  it('can start as a device that already saw onboarding', async () => {
    expect(await new InMemoryOnboardingStore(true).hasSeen()).toBe(true);
  });
});
