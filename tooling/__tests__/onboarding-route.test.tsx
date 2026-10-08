// Lives outside `app/`: Expo Router turns every file there into a route.
import { act } from '@testing-library/react-native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import {
  authRepositoryToken,
  InMemoryAuthRepository,
  SessionProvider,
} from '@/modules/auth';
import {
  InMemoryOnboardingStore,
  LaunchNavigator,
  OnboardingProvider,
  onboardingStoreToken,
} from '@/modules/onboarding';

import OnboardingRoute from '../../app/(auth)/onboarding';

const FIRST_TITLE = 'Um círculo pequeno, de gente que você conhece.';

// The real RootNavigator guards run, so a route that the flag removes cannot
// win over the destination the exit chose.
function launch(store: InMemoryOnboardingStore) {
  const auth = new InMemoryAuthRepository();
  return renderRouter(
    {
      _layout: () => (
        <DependencyProvider
          provisions={[
            provide(authRepositoryToken, auth),
            provide(onboardingStoreToken, store),
          ]}
        >
          <SessionProvider>
            <OnboardingProvider>
              <LaunchNavigator minSplashMs={0} />
            </OnboardingProvider>
          </SessionProvider>
        </DependencyProvider>
      ),
      '(auth)/onboarding': OnboardingRoute,
      '(auth)/sign-in': () => <Text>sign-in content</Text>,
      '(auth)/register': () => <Text>register content</Text>,
      '(app)/index': () => <Text>protected content</Text>,
    },
    { initialUrl: '/' },
  );
}

async function press(label: string) {
  await fireEvent.press(screen.getByRole('button', { name: label }));
}

afterEach(() => {
  jest.useRealTimers();
});

describe('onboarding route', () => {
  it('"Pular" on page 1 opens register and stores the flag', async () => {
    const store = new InMemoryOnboardingStore();
    const result = launch(store);
    await result;
    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();

    await press('Pular');

    expect(await screen.findByText('register content')).toBeTruthy();
    expect(result.getPathname()).toBe('/register');
    expect(await store.hasSeen()).toBe(true);
  });

  it('"Pular" on page 2 opens register and stores the flag', async () => {
    const store = new InMemoryOnboardingStore();
    const result = launch(store);
    await result;
    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();
    await press('Continuar');

    await press('Pular');

    expect(await screen.findByText('register content')).toBeTruthy();
    expect(result.getPathname()).toBe('/register');
    expect(await store.hasSeen()).toBe(true);
  });

  it('"Começar" opens register and stores the flag', async () => {
    const store = new InMemoryOnboardingStore();
    const result = launch(store);
    await result;
    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();
    await press('Continuar');
    await press('Continuar');

    await press('Começar');

    expect(await screen.findByText('register content')).toBeTruthy();
    expect(result.getPathname()).toBe('/register');
    expect(await store.hasSeen()).toBe(true);
  });

  it('"Já tenho conta" opens sign-in and stores the flag', async () => {
    const store = new InMemoryOnboardingStore();
    const result = launch(store);
    await result;
    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();
    await press('Continuar');
    await press('Continuar');

    await press('Já tenho conta');

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(await store.hasSeen()).toBe(true);
  });

  it('after an exit, the next launch on the device opens sign-in', async () => {
    const store = new InMemoryOnboardingStore();
    const first = await launch(store);
    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();
    await press('Pular');
    expect(await screen.findByText('register content')).toBeTruthy();
    await act(async () => {
      await first.unmount();
    });

    const second = launch(store);
    await second;

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(second.getPathname()).toBe('/sign-in');
    expect(screen.queryByText(FIRST_TITLE)).toBeNull();
  });

  it('without an exit, the next launch opens onboarding page 1 again', async () => {
    const store = new InMemoryOnboardingStore();
    const first = await launch(store);
    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();
    await press('Continuar');
    await act(async () => {
      await first.unmount();
    });

    const second = launch(store);
    await second;

    expect(await screen.findByText(FIRST_TITLE)).toBeTruthy();
    expect(second.getPathname()).toBe('/onboarding');
  });
});
