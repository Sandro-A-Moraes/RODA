import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { authRepositoryToken } from '../domain/auth-repository';
import type { AuthUser } from '../domain/auth-repository';
import { SessionProvider, useSession } from '../presentation/session-provider';

const ana = { displayName: 'Ana', email: 'ana@mail.com', password: '12345678' };

function Probe() {
  const { status, user } = useSession();
  return (
    <Text testID="session">{`${status}:${user?.displayName ?? 'none'}`}</Text>
  );
}

async function renderSession(repo: InMemoryAuthRepository) {
  return render(
    <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
      <SessionProvider>
        <Probe />
      </SessionProvider>
    </DependencyProvider>,
  );
}

function session() {
  return screen.getByTestId('session').props.children as string;
}

async function signedInRepository() {
  const repo = new InMemoryAuthRepository();
  await repo.signUp(ana);
  return repo;
}

describe('SessionProvider', () => {
  it('is loading while the session restore is pending', async () => {
    const repo = await signedInRepository();
    let resolve: (value: Result<AuthUser | null>) => void = () => undefined;
    jest
      .spyOn(repo, 'getCurrentUser')
      .mockReturnValue(new Promise((r) => (resolve = r)));

    await renderSession(repo);

    expect(session()).toBe('loading:none');

    await act(async () => resolve(ok(null)));
    expect(session()).toBe('signedOut:none');
  });

  it('becomes signedIn with the user when a session exists', async () => {
    const repo = await signedInRepository();

    await renderSession(repo);

    expect(await screen.findByText('signedIn:Ana')).toBeTruthy();
  });

  it('becomes signedOut when there is no session', async () => {
    await renderSession(new InMemoryAuthRepository());

    expect(await screen.findByText('signedOut:none')).toBeTruthy();
  });

  it('becomes signedOut when the restore returns an error', async () => {
    const repo = await signedInRepository();
    jest
      .spyOn(repo, 'getCurrentUser')
      .mockResolvedValue(err(createAppError('unauthorized')));

    await renderSession(repo);

    expect(await screen.findByText('signedOut:none')).toBeTruthy();
  });

  it('follows the repository: signedOut on sign-out, signedIn on sign-in', async () => {
    const repo = await signedInRepository();
    await renderSession(repo);
    await screen.findByText('signedIn:Ana');

    await act(async () => {
      await repo.signOut();
    });
    expect(session()).toBe('signedOut:none');

    await act(async () => {
      await repo.signIn({ email: ana.email, password: ana.password });
    });
    expect(session()).toBe('signedIn:Ana');
  });

  it('unsubscribes from the repository on unmount', async () => {
    const repo = await signedInRepository();
    const unsubscribe = jest.fn();
    const subscribe = repo.subscribe.bind(repo);
    jest.spyOn(repo, 'subscribe').mockImplementation((listener) => {
      const stop = subscribe(listener);
      return () => {
        unsubscribe();
        stop();
      };
    });
    const { unmount } = await renderSession(repo);
    await screen.findByText('signedIn:Ana');

    await unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
