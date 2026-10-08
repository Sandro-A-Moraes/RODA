// Lives outside `app/`: Expo Router turns every file there into a route.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { SupabaseAuthRepository } from '@/modules/auth';

import RootLayout from '../../app/_layout';
import AppLayout from '../../app/(app)/_layout';
import TabsLayout from '../../app/(app)/(tabs)/_layout';
import CirclesRoute from '../../app/(app)/(tabs)/index';
import MainRoute from '../../app/(app)/(tabs)/profile';
import OnboardingRoute from '../../app/(auth)/onboarding';
import RegisterRoute from '../../app/(auth)/register';
import SignInRoute from '../../app/(auth)/sign-in';

// The real client throws at import without env vars; the layout only needs a value to inject.
jest.mock('@/core/supabase', () => ({ supabase: { fake: 'supabase-client' } }));

// The layout takes no props, so the Supabase repository it builds is replaced by the
// in-memory one: the token it provides then resolves to InMemoryAuthRepository.
jest.mock('@/modules/auth', () => {
  const actual = jest.requireActual('@/modules/auth');
  const repo = new actual.InMemoryAuthRepository();
  return {
    ...actual,
    SupabaseAuthRepository: jest.fn(() => repo),
  };
});

// AsyncStorage throws at import under Jest; its official mock keeps items in memory.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

// The layout renders LaunchNavigator without props; drop the 1200 ms minimum so
// the test does not wait. Everything else is the real module.
jest.mock('@/modules/onboarding', () => {
  const actual = jest.requireActual('@/modules/onboarding');
  const { createElement } = jest.requireActual('react');
  return {
    ...actual,
    LaunchNavigator: () =>
      createElement(actual.LaunchNavigator, { minSplashMs: 0 }),
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderLayout() {
  return renderRouter(
    {
      _layout: RootLayout,
      '(app)/_layout': AppLayout,
      '(app)/(tabs)/_layout': TabsLayout,
      '(app)/(tabs)/index': CirclesRoute,
      '(app)/(tabs)/profile': MainRoute,
      '(auth)/onboarding': OnboardingRoute,
      '(auth)/sign-in': SignInRoute,
      '(auth)/register': RegisterRoute,
    },
    { initialUrl: '/' },
  );
}

describe('root layout', () => {
  it('opens onboarding on a fresh device and stores the flag in AsyncStorage on exit', async () => {
    const result = renderLayout();
    await result;

    expect(
      await screen.findByText('Um círculo pequeno, de gente que você conhece.'),
    ).toBeTruthy();
    expect(result.getPathname()).toBe('/onboarding');
    expect(await AsyncStorage.getItem('roda.onboarding.seen')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));

    expect(
      await screen.findByRole('button', { name: 'Criar conta' }),
    ).toBeTruthy();
    expect(result.getPathname()).toBe('/register');
    expect(await AsyncStorage.getItem('roda.onboarding.seen')).toBe('true');
  });

  it('provides the repository built from the supabase client and shows sign-in when signed out', async () => {
    await AsyncStorage.setItem('roda.onboarding.seen', 'true');
    const result = renderLayout();
    await result;

    expect(SupabaseAuthRepository).toHaveBeenCalledWith({
      fake: 'supabase-client',
    });
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(screen.queryByText(/^Olá,/)).toBeNull();
  });
});
