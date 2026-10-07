// Lives outside `app/`: Expo Router turns every file there into a route.
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { authRepositoryToken, InMemoryAuthRepository } from '@/modules/auth';

import SignInRoute from '../../app/(auth)/sign-in';

afterEach(() => {
  jest.useRealTimers();
});

describe('sign-in route', () => {
  it('renders the sign-in screen and its register link opens the register route', async () => {
    const repo = new InMemoryAuthRepository();
    const result = renderRouter(
      {
        _layout: () => (
          <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
            <Stack screenOptions={{ headerShown: false }} />
          </DependencyProvider>
        ),
        '(auth)/sign-in': SignInRoute,
        '(auth)/register': () => <Text>register content</Text>,
      },
      { initialUrl: '/sign-in' },
    );
    await result;

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('link', { name: 'Criar conta' }));

    expect(await screen.findByText('register content')).toBeTruthy();
    expect(result.getPathname()).toBe('/register');
  });
});
