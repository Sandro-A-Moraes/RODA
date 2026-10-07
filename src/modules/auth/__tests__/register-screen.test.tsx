import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';
import type { Result } from '@/core/errors';

import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { authRepositoryToken } from '../domain/auth-repository';
import type { AuthUser } from '../domain/auth-repository';
import { RegisterScreen } from '../presentation/register-screen';
import { SessionProvider, useSession } from '../presentation/session-provider';

const valid = { name: 'Ana Lima', email: 'ana@mail.com', password: '12345678' };

function SessionStatus() {
  const { status } = useSession();
  return <Text testID="status">{status}</Text>;
}

async function renderRegister(
  repo: InMemoryAuthRepository,
  onNavigateToSignIn = jest.fn(),
) {
  await render(
    <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
      <SessionProvider>
        <SessionStatus />
        <RegisterScreen onNavigateToSignIn={onNavigateToSignIn} />
      </SessionProvider>
    </DependencyProvider>,
  );
  await screen.findByText('signedOut');
}

async function fill(values: typeof valid) {
  await fireEvent.changeText(screen.getByLabelText('Nome'), values.name);
  await fireEvent.changeText(screen.getByLabelText('E-mail'), values.email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), values.password);
}

function submitButton() {
  return screen.getByRole('button', { name: 'Criar conta' });
}

describe('RegisterScreen', () => {
  it('registers with one repository call carrying normalized values', async () => {
    const repo = new InMemoryAuthRepository();
    const signUp = jest.spyOn(repo, 'signUp');
    await renderRegister(repo);

    await fill({
      name: '  Ana Lima ',
      email: '  Ana@Mail.COM ',
      password: '12345678',
    });
    await fireEvent.press(submitButton());

    expect(await screen.findByText('signedIn')).toBeTruthy();
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(signUp).toHaveBeenCalledWith({
      displayName: 'Ana Lima',
      email: 'ana@mail.com',
      password: '12345678',
    });
  });

  it.each([
    ['E-mail', { email: 'ana.mail.com' }, 'E-mail inválido'],
    ['Senha', { password: '1234567' }, 'A senha deve ter pelo menos 8 caracteres'],
    ['Nome', { name: 'A' }, 'Nome deve ter entre 2 e 40 caracteres'],
  ])(
    'shows the exact message on the %s field and does not call the repository',
    async (field, override, message) => {
      const repo = new InMemoryAuthRepository();
      const signUp = jest.spyOn(repo, 'signUp');
      await renderRegister(repo);

      await fill({ ...valid, ...override });
      await fireEvent.press(submitButton());

      expect(await screen.findByText(message)).toBeTruthy();
      expect(screen.getByLabelText(field).props.accessibilityHint).toBe(
        message,
      );
      const others = ['Nome', 'E-mail', 'Senha'].filter((f) => f !== field);
      for (const other of others) {
        expect(screen.getByLabelText(other).props.accessibilityHint).toBe(
          undefined,
        );
      }
      expect(signUp).toHaveBeenCalledTimes(0);
    },
  );

  it('shows the banner "Este e-mail já está cadastrado" for a duplicate e-mail', async () => {
    const repo = new InMemoryAuthRepository();
    await repo.signUp({
      displayName: 'Ana',
      email: 'ana@mail.com',
      password: '12345678',
    });
    await repo.signOut();
    await renderRegister(repo);

    await fill(valid);
    await fireEvent.press(submitButton());

    expect(
      await screen.findByText('Este e-mail já está cadastrado'),
    ).toBeTruthy();
    expect(screen.getByTestId('status')).toHaveTextContent('signedOut');
  });

  it('keeps the submit button loading and ignores a second press while pending', async () => {
    const repo = new InMemoryAuthRepository();
    let resolve: (value: Result<AuthUser>) => void = () => undefined;
    const signUp = jest
      .spyOn(repo, 'signUp')
      .mockReturnValue(new Promise((r) => (resolve = r)));
    await renderRegister(repo);
    await fill(valid);

    await fireEvent.press(submitButton());
    expect(submitButton().props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
    await fireEvent.press(submitButton());
    await act(async () => resolve(err(createAppError('network'))));

    expect(signUp).toHaveBeenCalledTimes(1);
    expect(submitButton().props.accessibilityState).toMatchObject({
      busy: false,
    });
  });

  it('shows the network banner with "Tentar novamente" that calls signUp again', async () => {
    const repo = new InMemoryAuthRepository();
    const signUp = jest
      .spyOn(repo, 'signUp')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderRegister(repo);
    await fill({
      name: '  Ana Lima ',
      email: '  Ana@Mail.COM ',
      password: '12345678',
    });

    await fireEvent.press(submitButton());

    expect(
      await screen.findByText(createAppError('network').message),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText('Tentar novamente'));

    expect(await screen.findByText('signedIn')).toBeTruthy();
    expect(signUp).toHaveBeenCalledTimes(2);
    expect(signUp).toHaveBeenNthCalledWith(2, {
      displayName: 'Ana Lima',
      email: 'ana@mail.com',
      password: '12345678',
    });
  });

  it('calls onNavigateToSignIn from the sign-in link', async () => {
    const onNavigateToSignIn = jest.fn();
    await renderRegister(new InMemoryAuthRepository(), onNavigateToSignIn);

    await fireEvent.press(screen.getByRole('link', { name: 'Já tenho conta' }));

    expect(onNavigateToSignIn).toHaveBeenCalledTimes(1);
  });
});
