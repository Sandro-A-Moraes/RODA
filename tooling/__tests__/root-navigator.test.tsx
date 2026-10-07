// Route tree built in memory with the same group names as app/ (AD-007).
// Kept outside `app/`: Expo Router turns every file there into a route.
import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { InMemoryAuthRepository } from '@/modules/auth/data/in-memory-auth-repository';
import { authRepositoryToken } from '@/modules/auth/domain/auth-repository';
import { RootNavigator } from '@/modules/auth/presentation/root-navigator';
import { SessionProvider } from '@/modules/auth/presentation/session-provider';

const ana = { displayName: 'Ana', email: 'ana@mail.com', password: '12345678' };

function renderApp(repo: InMemoryAuthRepository, initialUrl: string) {
  const signInRendered = jest.fn();
  const mainRendered = jest.fn();
  const routes = {
    _layout: () => (
      <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </DependencyProvider>
    ),
    '(auth)/sign-in': () => {
      signInRendered();
      return <Text>sign-in content</Text>;
    },
    '(auth)/register': () => <Text>register content</Text>,
    '(app)/index': () => {
      mainRendered();
      return <Text>protected content</Text>;
    },
  };
  const result = renderRouter(routes, { initialUrl });
  return { result, signInRendered, mainRendered };
}

async function signedInRepository() {
  const repo = new InMemoryAuthRepository();
  await repo.signUp(ana);
  return repo;
}

afterEach(() => {
  jest.useRealTimers();
});

describe('RootNavigator', () => {
  it('shows only the loading indicator while the session restores', async () => {
    const repo = await signedInRepository();
    jest
      .spyOn(repo, 'getCurrentUser')
      .mockReturnValue(new Promise(() => undefined));

    const { result, signInRendered, mainRendered } = renderApp(repo, '/');
    await result;

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
    expect(screen.queryByText('protected content')).toBeNull();
    expect(screen.queryByText('sign-in content')).toBeNull();
    expect(mainRendered).not.toHaveBeenCalled();
    expect(signInRendered).not.toHaveBeenCalled();
  });

  it('lands a signed-out user at / on the sign-in screen', async () => {
    const { result, mainRendered } = renderApp(
      new InMemoryAuthRepository(),
      '/',
    );
    await result;

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(screen.queryByText('protected content')).toBeNull();
    expect(mainRendered).not.toHaveBeenCalled();
  });

  it('redirects a signed-out user opening the (app) route URL to sign-in', async () => {
    const { result, mainRendered } = renderApp(
      new InMemoryAuthRepository(),
      '/(app)',
    );
    await result;

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(mainRendered).not.toHaveBeenCalled();
  });

  it('keeps a signed-out user out of the main area on in-app navigation', async () => {
    const { result, mainRendered } = renderApp(
      new InMemoryAuthRepository(),
      '/register',
    );
    await result;
    expect(await screen.findByText('register content')).toBeTruthy();

    await act(async () => {
      router.navigate('/');
    });

    expect(screen.queryByText('protected content')).toBeNull();
    expect(mainRendered).not.toHaveBeenCalled();
  });

  it.each(['/sign-in', '/register'])(
    'redirects a signed-in user opening %s to the main area',
    async (url) => {
      const repo = await signedInRepository();
      const { result } = renderApp(repo, url);
      await result;

      expect(await screen.findByText('protected content')).toBeTruthy();
      expect(result.getPathname()).toBe('/');
      expect(screen.queryByText('sign-in content')).toBeNull();
      expect(screen.queryByText('register content')).toBeNull();
    },
  );

  it('lands a restored session in the main area without rendering sign-in', async () => {
    const repo = await signedInRepository();
    const { result, signInRendered } = renderApp(repo, '/');
    await result;

    expect(await screen.findByText('protected content')).toBeTruthy();
    expect(result.getPathname()).toBe('/');
    expect(signInRendered).not.toHaveBeenCalled();
  });

  it('moves to sign-in when the session ends in the main area', async () => {
    const repo = await signedInRepository();
    const { result } = renderApp(repo, '/');
    await result;
    expect(await screen.findByText('protected content')).toBeTruthy();

    await act(async () => {
      await repo.signOut();
    });

    expect(await screen.findByText('sign-in content')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
    expect(screen.queryByText('protected content')).toBeNull();
  });
});
