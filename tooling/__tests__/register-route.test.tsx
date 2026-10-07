// Lives outside `app/`: Expo Router turns every file there into a route.
import { act } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { authRepositoryToken, InMemoryAuthRepository } from '@/modules/auth';

import RegisterRoute from '../../app/(auth)/register';

function renderRegisterTree(initialUrl: string) {
  const repo = new InMemoryAuthRepository();
  return renderRouter(
    {
      _layout: () => (
        <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
          <Stack screenOptions={{ headerShown: false }} />
        </DependencyProvider>
      ),
      '(auth)/sign-in': () => <Text>sign-in content</Text>,
      '(auth)/register': RegisterRoute,
    },
    { initialUrl },
  );
}

afterEach(() => {
  jest.useRealTimers();
});

describe('register route', () => {
  it('renders the register screen and its sign-in link opens sign-in', async () => {
    const result = renderRegisterTree('/register');
    await result;

    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('link', { name: 'Já tenho conta' }));

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
  });

  it('goes back to the sign-in entry it came from instead of stacking a new one', async () => {
    const result = renderRegisterTree('/sign-in');
    await result;
    await act(async () => {
      router.push('/register');
    });
    expect(router.canGoBack()).toBe(true);

    await fireEvent.press(screen.getByRole('link', { name: 'Já tenho conta' }));

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(router.canGoBack()).toBe(false);
  });
});
