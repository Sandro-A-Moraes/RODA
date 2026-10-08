import { act } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import {
  authRepositoryToken,
  InMemoryAuthRepository,
  SessionProvider,
} from '@/modules/auth';

import { InMemoryOnboardingStore } from '../data/in-memory-onboarding-store';
import { onboardingStoreToken } from '../domain/onboarding-store';
import { LaunchNavigator } from '../presentation/launch-navigator';
import { OnboardingProvider } from '../presentation/onboarding-provider';

const ana = { displayName: 'Ana', email: 'ana@mail.com', password: '12345678' };
const TAGLINE = 'Menos tela. Mais roda.';

interface Launch {
  auth: InMemoryAuthRepository;
  store: InMemoryOnboardingStore;
  url?: string;
  /** 0 by default so tests do not wait; 'default' renders without the prop. */
  minSplashMs?: number | 'default';
}

function renderLaunch({ auth, store, url = '/', minSplashMs = 0 }: Launch) {
  const rendered = {
    onboarding: jest.fn(),
    signIn: jest.fn(),
    main: jest.fn(),
  };
  const result = renderRouter(
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
              {minSplashMs === 'default' ? (
                <LaunchNavigator />
              ) : (
                <LaunchNavigator minSplashMs={minSplashMs} />
              )}
            </OnboardingProvider>
          </SessionProvider>
        </DependencyProvider>
      ),
      '(auth)/onboarding': () => {
        rendered.onboarding();
        return <Text>onboarding content</Text>;
      },
      '(auth)/sign-in': () => {
        rendered.signIn();
        return <Text>sign-in content</Text>;
      },
      '(auth)/register': () => <Text>register content</Text>,
      '(app)/index': () => {
        rendered.main();
        return <Text>protected content</Text>;
      },
    },
    { initialUrl: url },
  );
  return { result, rendered };
}

async function signedIn() {
  const auth = new InMemoryAuthRepository();
  await auth.signUp(ana);
  return auth;
}

function expectNoRouteContent() {
  expect(screen.queryByText('onboarding content')).toBeNull();
  expect(screen.queryByText('sign-in content')).toBeNull();
  expect(screen.queryByText('register content')).toBeNull();
  expect(screen.queryByText('protected content')).toBeNull();
}

afterEach(() => {
  jest.useRealTimers();
});

describe('LaunchNavigator', () => {
  describe('splash', () => {
    it('is the only thing shown while the session restores', async () => {
      const auth = await signedIn();
      jest
        .spyOn(auth, 'getCurrentUser')
        .mockReturnValue(new Promise(() => undefined));

      const { result, rendered } = renderLaunch({
        auth,
        store: new InMemoryOnboardingStore(),
      });
      await result;
      await act(async () => undefined);

      expect(screen.getByLabelText('Roda. Carregando')).toBeTruthy();
      expect(screen.getByText(TAGLINE)).toBeTruthy();
      expectNoRouteContent();
      expect(rendered.main).not.toHaveBeenCalled();
    });

    it('is the only thing shown while the flag is read', async () => {
      const store = new InMemoryOnboardingStore();
      jest
        .spyOn(store, 'hasSeen')
        .mockReturnValue(new Promise(() => undefined));

      const { result, rendered } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store,
      });
      await result;
      await act(async () => undefined);

      expect(screen.getByText(TAGLINE)).toBeTruthy();
      expectNoRouteContent();
      expect(rendered.signIn).not.toHaveBeenCalled();
    });

    it('stays for 1200 ms by default even when everything is known', async () => {
      jest.useFakeTimers();
      const { result } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store: new InMemoryOnboardingStore(true),
        minSplashMs: 'default',
      });
      await result;

      await act(async () => {
        jest.advanceTimersByTime(1199);
      });
      expect(screen.getByText(TAGLINE)).toBeTruthy();
      expectNoRouteContent();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByText('sign-in content')).toBeTruthy();
      expect(screen.queryByText(TAGLINE)).toBeNull();
    });

    it('honors a shorter minimum passed as a prop', async () => {
      jest.useFakeTimers();
      const { result } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store: new InMemoryOnboardingStore(true),
        minSplashMs: 300,
      });
      await result;

      await act(async () => {
        jest.advanceTimersByTime(299);
      });
      expect(screen.getByText(TAGLINE)).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByText('sign-in content')).toBeTruthy();
    });
  });

  describe('landing route', () => {
    it('opens the main area for a signed-in user and never onboarding', async () => {
      const { result, rendered } = renderLaunch({
        auth: await signedIn(),
        store: new InMemoryOnboardingStore(),
      });
      await result;

      expect(await screen.findByText('protected content')).toBeTruthy();
      expect(result.getPathname()).toBe('/');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });

    it('opens onboarding for a signed-out user on a fresh device', async () => {
      const { result, rendered } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store: new InMemoryOnboardingStore(),
      });
      await result;

      expect(await screen.findByText('onboarding content')).toBeTruthy();
      expect(result.getPathname()).toBe('/onboarding');
      expect(rendered.signIn).not.toHaveBeenCalled();
    });

    it('opens sign-in for a signed-out user when the flag is set', async () => {
      const { result, rendered } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store: new InMemoryOnboardingStore(true),
      });
      await result;

      expect(await screen.findByText('sign-in content')).toBeTruthy();
      expect(result.getPathname()).toBe('/sign-in');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });

    it('redirects a signed-out user opening /onboarding to sign-in when the flag is set', async () => {
      const { result, rendered } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store: new InMemoryOnboardingStore(true),
        url: '/onboarding',
      });
      await result;

      expect(await screen.findByText('sign-in content')).toBeTruthy();
      expect(result.getPathname()).toBe('/sign-in');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });

    it('redirects a signed-in user opening /onboarding to the main area', async () => {
      const { result, rendered } = renderLaunch({
        auth: await signedIn(),
        store: new InMemoryOnboardingStore(),
        url: '/onboarding',
      });
      await result;

      expect(await screen.findByText('protected content')).toBeTruthy();
      expect(result.getPathname()).toBe('/');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });

    it('opens sign-in when reading the flag fails', async () => {
      const store = new InMemoryOnboardingStore();
      jest.spyOn(store, 'hasSeen').mockRejectedValue(new Error('storage down'));

      const { result, rendered } = renderLaunch({
        auth: new InMemoryAuthRepository(),
        store,
      });
      await result;

      expect(await screen.findByText('sign-in content')).toBeTruthy();
      expect(result.getPathname()).toBe('/sign-in');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });
  });

  describe('session changes', () => {
    it('stores the flag when the session becomes signed in, so a later sign-out opens sign-in', async () => {
      const auth = new InMemoryAuthRepository();
      await auth.signUp(ana);
      await auth.signOut();
      const store = new InMemoryOnboardingStore();
      const { result, rendered } = renderLaunch({
        auth,
        store,
        url: '/sign-in',
      });
      await result;
      expect(await screen.findByText('sign-in content')).toBeTruthy();

      await act(async () => {
        await auth.signIn({ email: ana.email, password: ana.password });
      });
      expect(await screen.findByText('protected content')).toBeTruthy();
      expect(await store.hasSeen()).toBe(true);

      await act(async () => {
        await auth.signOut();
      });
      expect(await screen.findByText('sign-in content')).toBeTruthy();
      expect(result.getPathname()).toBe('/sign-in');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });

    it('opens sign-in, not onboarding, when a user signs out after the flag is set', async () => {
      const auth = await signedIn();
      const { result, rendered } = renderLaunch({
        auth,
        store: new InMemoryOnboardingStore(true),
      });
      await result;
      expect(await screen.findByText('protected content')).toBeTruthy();

      await act(async () => {
        await auth.signOut();
      });

      expect(await screen.findByText('sign-in content')).toBeTruthy();
      expect(result.getPathname()).toBe('/sign-in');
      expect(rendered.onboarding).not.toHaveBeenCalled();
    });
  });
});
