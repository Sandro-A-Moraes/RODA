import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { authRepositoryToken } from '../domain/auth-repository';
import { HomeScreen } from '../presentation/home-screen';
import { SessionProvider, useSession } from '../presentation/session-provider';

function SessionStatus() {
  const { status } = useSession();
  return <Text testID="status">{status}</Text>;
}

async function renderSignedInHome() {
  const repo = new InMemoryAuthRepository();
  await repo.signUp({
    displayName: 'Ana Lima',
    email: 'ana@mail.com',
    password: '12345678',
  });
  await render(
    <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
      <SessionProvider>
        <SessionStatus />
        <HomeScreen />
      </SessionProvider>
    </DependencyProvider>,
  );
  await screen.findByText('signedIn');
  return repo;
}

describe('HomeScreen', () => {
  it('shows the signed-in display name', async () => {
    await renderSignedInHome();

    expect(screen.getByText('Olá, Ana Lima')).toBeTruthy();
  });

  it('signs out once when "Sair" is pressed and the session becomes signedOut', async () => {
    const repo = await renderSignedInHome();
    const signOut = jest.spyOn(repo, 'signOut');

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByText('signedOut')).toBeTruthy();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('shows the error banner when sign-out fails instead of crashing', async () => {
    const repo = await renderSignedInHome();
    jest
      .spyOn(repo, 'signOut')
      .mockResolvedValue(err(createAppError('network')));

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));

    expect(
      await screen.findByText(createAppError('network').message),
    ).toBeTruthy();
    expect(screen.getByTestId('status')).toHaveTextContent('signedIn');
    expect(screen.getByText('Olá, Ana Lima')).toBeTruthy();
  });
});
