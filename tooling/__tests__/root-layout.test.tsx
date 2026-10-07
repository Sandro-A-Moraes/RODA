// Lives outside `app/`: Expo Router turns every file there into a route.
import { renderRouter, screen } from 'expo-router/testing-library';

import { SupabaseAuthRepository } from '@/modules/auth';

import RootLayout from '../../app/_layout';
import AppLayout from '../../app/(app)/_layout';
import TabsLayout from '../../app/(app)/(tabs)/_layout';
import CirclesRoute from '../../app/(app)/(tabs)/index';
import MainRoute from '../../app/(app)/(tabs)/profile';
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

afterEach(() => {
  jest.useRealTimers();
});

describe('root layout', () => {
  it('provides the repository built from the supabase client and shows sign-in when signed out', async () => {
    const result = renderRouter(
      {
        _layout: RootLayout,
        '(app)/_layout': AppLayout,
        '(app)/(tabs)/_layout': TabsLayout,
        '(app)/(tabs)/index': CirclesRoute,
        '(app)/(tabs)/profile': MainRoute,
        '(auth)/sign-in': SignInRoute,
        '(auth)/register': RegisterRoute,
      },
      { initialUrl: '/' },
    );
    await result;

    expect(SupabaseAuthRepository).toHaveBeenCalledWith({
      fake: 'supabase-client',
    });
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(screen.queryByText(/^Olá,/)).toBeNull();
  });
});
