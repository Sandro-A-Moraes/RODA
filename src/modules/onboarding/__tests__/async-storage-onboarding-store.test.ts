import {
  AsyncStorageOnboardingStore,
  ONBOARDING_SEEN_KEY,
} from '../data/async-storage-onboarding-store';
import type { KeyValueStorage } from '../data/async-storage-onboarding-store';

function fakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const storage: KeyValueStorage = {
    getItem: async (key) => items.get(key) ?? null,
    setItem: async (key, value) => {
      items.set(key, value);
    },
  };
  return { storage, items };
}

describe('AsyncStorageOnboardingStore', () => {
  it('uses the key roda.onboarding.seen', () => {
    expect(ONBOARDING_SEEN_KEY).toBe('roda.onboarding.seen');
  });

  it('reports unseen when the key is absent', async () => {
    const { storage } = fakeStorage();
    expect(await new AsyncStorageOnboardingStore(storage).hasSeen()).toBe(
      false,
    );
  });

  it('writes "true" under roda.onboarding.seen on markSeen', async () => {
    const { storage, items } = fakeStorage();
    const store = new AsyncStorageOnboardingStore(storage);

    await store.markSeen();

    expect(items.get('roda.onboarding.seen')).toBe('true');
    expect(await store.hasSeen()).toBe(true);
  });

  it('reports seen when "true" is already stored', async () => {
    const { storage } = fakeStorage({ 'roda.onboarding.seen': 'true' });
    expect(await new AsyncStorageOnboardingStore(storage).hasSeen()).toBe(true);
  });
});
