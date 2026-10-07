import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';

import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import type { CurrentUser } from '../data/in-memory-circle-repository';
import {
  circleRepositoryToken,
  MAX_CIRCLE_MEMBERS,
} from '../domain/circle-repository';
import { JoinCircleScreen } from '../presentation/join-circle-screen';

async function renderScreen() {
  let current: CurrentUser = { id: 'u1', displayName: 'Ana' };
  const repo = new InMemoryCircleRepository(() => current);
  const created = await repo.create('Família');
  if (!created.ok) throw new Error('setup failed');
  const code = created.value.inviteCode;
  const as = (user: CurrentUser) => {
    current = user;
  };
  as({ id: 'u2', displayName: 'Beto' });

  const onJoined = jest.fn();
  const onBack = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(circleRepositoryToken, repo)]}>
      <JoinCircleScreen onBack={onBack} onJoined={onJoined} />
    </DependencyProvider>,
  );
  return { repo, code, as, onJoined, onBack };
}

const typeCode = (value: string) =>
  fireEvent.changeText(screen.getByLabelText('Código de convite'), value);
const submit = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Entrar no círculo' }));

describe('JoinCircleScreen', () => {
  it('joins with a valid code and reports the circle (CIR-03)', async () => {
    const { code, onJoined } = await renderScreen();

    await typeCode(code);
    await submit();

    await screen.findByLabelText('Código de convite');
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(onJoined.mock.calls[0][0]).toMatchObject({
      name: 'Família',
      memberCount: 2,
    });
  });

  it('matches a lowercase code with surrounding spaces (CIR-03)', async () => {
    const { repo, code, onJoined } = await renderScreen();
    const join = jest.spyOn(repo, 'join');

    await typeCode(` ${code.toLowerCase()} `);
    await submit();

    expect(join).toHaveBeenCalledWith(code);
    expect(onJoined).toHaveBeenCalledTimes(1);
  });

  it('shows the typed code in upper case, capped at 6 characters', async () => {
    await renderScreen();

    await typeCode('abc2345');

    expect(screen.getByLabelText('Código de convite').props.value).toBe(
      'ABC234',
    );
  });

  it('asks for the code without calling the repository when empty (CIR-03)', async () => {
    const { repo, onJoined } = await renderScreen();
    const join = jest.spyOn(repo, 'join');

    await submit();

    expect(await screen.findByText('Informe o código')).toBeTruthy();
    expect(join).not.toHaveBeenCalled();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('shows "Código não encontrado" for an unknown code (CIR-04)', async () => {
    const { onJoined } = await renderScreen();

    await typeCode('ZZZZZZ');
    await submit();

    expect(await screen.findByText('Código não encontrado')).toBeTruthy();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('shows the already-a-member message and adds no second membership (CIR-04)', async () => {
    const { repo, code, as, onJoined } = await renderScreen();
    await repo.join(code);

    await typeCode(code);
    await submit();

    expect(
      await screen.findByText('Você já faz parte deste círculo'),
    ).toBeTruthy();
    expect(onJoined).not.toHaveBeenCalled();
    as({ id: 'u1', displayName: 'Ana' });
    const mine = await repo.listMine();
    expect(mine.ok && mine.value[0]?.memberCount).toBe(2);
  });

  it('shows "Este círculo está cheio" for a full circle (CIR-05)', async () => {
    const { repo, code, as, onJoined } = await renderScreen();
    for (let i = 3; i <= MAX_CIRCLE_MEMBERS + 1; i += 1) {
      as({ id: `u${i}`, displayName: `M${i}` });
      await repo.join(code);
    }
    as({ id: 'u99', displayName: 'Última' });

    await typeCode(code);
    await submit();

    expect(await screen.findByText('Este círculo está cheio')).toBeTruthy();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('goes back from the header', async () => {
    const { onBack } = await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
