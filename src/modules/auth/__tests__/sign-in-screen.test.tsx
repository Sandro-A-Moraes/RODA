import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';
import type { Result } from '@/core/errors';

import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { authRepositoryToken } from '../domain/auth-repository';
import type { AuthUser } from '../domain/auth-repository';
import { SessionProvider, useSession } from '../presentation/session-provider';
import { SignInScreen } from '../presentation/sign-in-screen';

const ana = { displayName: 'Ana', email: 'ana@mail.com', password: '12345678' };
const RAW = 'RAW-BACKEND-TEXT-42';

interface JsonNode {
  type: string;
  props: Record<string, unknown>;
  children: (JsonNode | string)[] | null;
}

function SessionStatus() {
  const { status } = useSession();
  return <Text testID="status">{status}</Text>;
}

async function registeredRepository() {
  const repo = new InMemoryAuthRepository();
  await repo.signUp(ana);
  await repo.signOut();
  return repo;
}

async function renderSignIn(
  repo: InMemoryAuthRepository,
  onNavigateToRegister = jest.fn(),
) {
  await render(
    <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
      <SessionProvider>
        <SessionStatus />
        <SignInScreen onNavigateToRegister={onNavigateToRegister} />
      </SessionProvider>
    </DependencyProvider>,
  );
  await screen.findByText('signedOut');
}

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), password);
}

async function fillAndSubmit(email: string, password: string) {
  await fill(email, password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

// ErrorBanner is a View with role "alert" (not an accessibility element for
// role queries), so locate it in the rendered tree.
function banner() {
  const nodes = documentOrder(screen.toJSON() as JsonNode | JsonNode[]);
  return nodes.find((node) => node.props.accessibilityRole === 'alert');
}

// Depth-first, document-order list of host nodes.
function documentOrder(node: JsonNode | JsonNode[] | null): JsonNode[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(documentOrder);
  const children = (node.children ?? []).filter(
    (child): child is JsonNode => typeof child !== 'string',
  );
  return [node, ...children.flatMap(documentOrder)];
}

function allText(node: JsonNode | JsonNode[] | null): string {
  return JSON.stringify(node);
}

describe('SignInScreen', () => {
  it('signs in with valid credentials: one repository call and the session becomes signedIn', async () => {
    const repo = await registeredRepository();
    const signIn = jest.spyOn(repo, 'signIn');
    await renderSignIn(repo);

    await fillAndSubmit('  ANA@mail.com ', '12345678');

    expect(await screen.findByText('signedIn')).toBeTruthy();
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith({
      email: 'ana@mail.com',
      password: '12345678',
    });
  });

  it('shows the banner "E-mail ou senha incorretos" for a wrong password', async () => {
    const repo = await registeredRepository();
    await renderSignIn(repo);

    await fillAndSubmit('ana@mail.com', 'wrong-password');

    expect(await screen.findByText('E-mail ou senha incorretos')).toBeTruthy();
    expect(allText(banner() ?? null)).toContain('E-mail ou senha incorretos');
    expect(screen.getByTestId('status')).toHaveTextContent('signedOut');
  });

  it('shows "Campo obrigatório" under each empty field and does not call the repository', async () => {
    const repo = await registeredRepository();
    const signIn = jest.spyOn(repo, 'signIn');
    await renderSignIn(repo);

    await fillAndSubmit('', '');

    expect(await screen.findAllByText('Campo obrigatório')).toHaveLength(2);
    expect(screen.getByLabelText('E-mail').props.accessibilityHint).toBe(
      'Campo obrigatório',
    );
    expect(screen.getByLabelText('Senha').props.accessibilityHint).toBe(
      'Campo obrigatório',
    );
    expect(signIn).toHaveBeenCalledTimes(0);
  });

  it('shows the network banner with "Tentar novamente" that calls the repository again', async () => {
    const repo = await registeredRepository();
    const signIn = jest
      .spyOn(repo, 'signIn')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderSignIn(repo);

    await fillAndSubmit('ana@mail.com', '12345678');

    const message = createAppError('network').message;
    expect(await screen.findByText(message)).toBeTruthy();
    expect(allText(banner() ?? null)).toContain(message);
    expect(allText(banner() ?? null)).toContain('Tentar novamente');
    await fireEvent.press(screen.getByText('Tentar novamente'));

    expect(await screen.findByText('signedIn')).toBeTruthy();
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(signIn).toHaveBeenNthCalledWith(2, {
      email: 'ana@mail.com',
      password: '12345678',
    });
  });

  it('shows no retry action for a non-network error', async () => {
    const repo = await registeredRepository();
    await renderSignIn(repo);

    await fillAndSubmit('ana@mail.com', 'wrong-password');

    await screen.findByText('E-mail ou senha incorretos');
    expect(screen.queryByText('Tentar novamente')).toBeNull();
  });

  it('makes a single repository call for two quick presses', async () => {
    const repo = await registeredRepository();
    let resolve: (value: Result<AuthUser>) => void = () => undefined;
    const signIn = jest
      .spyOn(repo, 'signIn')
      .mockReturnValue(new Promise((r) => (resolve = r)));
    await renderSignIn(repo);
    await fill('ana@mail.com', '12345678');

    const button = screen.getByRole('button', { name: 'Entrar' });
    await fireEvent.press(button);
    await fireEvent.press(button);
    await act(async () => resolve(err(createAppError('network'))));

    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('never renders a raw backend string', async () => {
    const repo = await registeredRepository();
    jest.spyOn(repo, 'signIn').mockRejectedValue(new Error(RAW));
    await renderSignIn(repo);

    await fillAndSubmit('ana@mail.com', '12345678');

    const message = createAppError('unknown').message;
    expect(await screen.findByText(message)).toBeTruthy();
    expect(allText(banner() ?? null)).toContain(message);
    expect(allText(screen.toJSON() as JsonNode)).not.toContain(RAW);
  });

  it('renders the error banner after the form fields', async () => {
    const repo = await registeredRepository();
    await renderSignIn(repo);

    await fillAndSubmit('ana@mail.com', 'wrong-password');
    await screen.findByText('E-mail ou senha incorretos');

    const nodes = documentOrder(screen.toJSON() as JsonNode | JsonNode[]);
    const position = (predicate: (node: JsonNode) => boolean) =>
      nodes.findIndex(predicate);
    const email = position((n) => n.props.accessibilityLabel === 'E-mail');
    const password = position((n) => n.props.accessibilityLabel === 'Senha');
    const banner = position((n) => n.props.accessibilityRole === 'alert');
    expect(email).toBeGreaterThanOrEqual(0);
    expect(password).toBeGreaterThan(email);
    expect(banner).toBeGreaterThan(password);
  });

  it('calls onNavigateToRegister from the register link', async () => {
    const onNavigateToRegister = jest.fn();
    await renderSignIn(new InMemoryAuthRepository(), onNavigateToRegister);

    await fireEvent.press(screen.getByRole('link', { name: 'Criar conta' }));

    expect(onNavigateToRegister).toHaveBeenCalledTimes(1);
  });
});
