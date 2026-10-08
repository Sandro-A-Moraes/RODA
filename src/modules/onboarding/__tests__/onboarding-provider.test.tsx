import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';

import { InMemoryOnboardingStore } from '../data/in-memory-onboarding-store';
import { onboardingStoreToken } from '../domain/onboarding-store';
import type { OnboardingStore } from '../domain/onboarding-store';
import {
  OnboardingProvider,
  useOnboarding,
} from '../presentation/onboarding-provider';

function Probe() {
  const { status, markSeen } = useOnboarding();
  return (
    <Pressable accessibilityRole="button" onPress={markSeen}>
      <Text testID="status">{status}</Text>
    </Pressable>
  );
}

async function renderProvider(store: OnboardingStore) {
  return render(
    <DependencyProvider provisions={[provide(onboardingStoreToken, store)]}>
      <OnboardingProvider>
        <Probe />
      </OnboardingProvider>
    </DependencyProvider>,
  );
}

function status() {
  return screen.getByTestId('status').props.children as string;
}

describe('OnboardingProvider', () => {
  it('is loading while the flag is read, then unseen on a fresh device', async () => {
    const store = new InMemoryOnboardingStore();
    let resolve: (seen: boolean) => void = () => undefined;
    jest
      .spyOn(store, 'hasSeen')
      .mockReturnValue(new Promise((r) => (resolve = r)));

    await renderProvider(store);
    expect(status()).toBe('loading');

    await act(async () => resolve(false));
    expect(status()).toBe('unseen');
  });

  it('is seen when the device already went through onboarding', async () => {
    await renderProvider(new InMemoryOnboardingStore(true));
    expect(await screen.findByText('seen')).toBeTruthy();
  });

  it('treats a failed read as seen', async () => {
    const store = new InMemoryOnboardingStore();
    jest.spyOn(store, 'hasSeen').mockRejectedValue(new Error('storage down'));

    await renderProvider(store);

    expect(await screen.findByText('seen')).toBeTruthy();
  });

  it('markSeen switches to seen and persists the flag', async () => {
    const store = new InMemoryOnboardingStore();
    await renderProvider(store);
    expect(await screen.findByText('unseen')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));

    expect(status()).toBe('seen');
    expect(await store.hasSeen()).toBe(true);
  });

  it('ignores a failed write and stays seen for the session', async () => {
    const store = new InMemoryOnboardingStore();
    jest.spyOn(store, 'markSeen').mockRejectedValue(new Error('disk full'));
    await renderProvider(store);
    expect(await screen.findByText('unseen')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));
    await act(async () => undefined);

    expect(status()).toBe('seen');
  });

  it('throws when used outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(render(<Probe />)).rejects.toThrow(
      'useOnboarding must be used inside OnboardingProvider',
    );
  });
});
