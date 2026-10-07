import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import type { CurrentUser } from '../data/in-memory-circle-repository';
import { circleRepositoryToken } from '../domain/circle-repository';
import type { Circle } from '../domain/circle-repository';
import { CirclesListScreen } from '../presentation/circles-list-screen';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

function newRepo() {
  let current: CurrentUser = { id: 'u1', displayName: 'Ana Lima' };
  const repo = new InMemoryCircleRepository(() => current);
  const as = (user: CurrentUser) => {
    current = user;
  };
  return { repo, as };
}

async function renderList(repo: InMemoryCircleRepository) {
  const handlers = {
    onOpen: jest.fn(),
    onCreate: jest.fn(),
    onJoin: jest.fn(),
  };
  await render(
    <DependencyProvider provisions={[provide(circleRepositoryToken, repo)]}>
      <CirclesListScreen userName="Ana Lima" {...handlers} />
    </DependencyProvider>,
  );
  return handlers;
}

describe('CirclesListScreen', () => {
  it('shows a loading indicator while the list loads (CIR-06)', async () => {
    const { repo } = newRepo();
    let release: (value: Result<Circle[]>) => void = () => undefined;
    jest.spyOn(repo, 'listMine').mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    await renderList(repo);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
    release(ok([]));
    expect(await screen.findByText('Seu primeiro círculo')).toBeTruthy();
    expect(screen.queryByLabelText('Carregando')).toBeNull();
  });

  it('shows the empty state with both actions (CIR-06)', async () => {
    const { repo } = newRepo();
    const { onCreate, onJoin } = await renderList(repo);

    await screen.findByText('Seu primeiro círculo');
    const create = screen
      .getAllByRole('button', { name: 'Criar círculo' })
      .at(-1);
    if (!create) throw new Error('missing create action');
    await fireEvent.press(create);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Entrar com código' }),
    );

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('lists only my circles, each with "N de 12 membros" (CIR-06, CIR-08)', async () => {
    const { repo, as } = newRepo();
    const mine = await repo.create('Família');
    await repo.create('Trabalho');
    as({ id: 'u2', displayName: 'Beto' });
    await repo.create('Do Beto');
    if (!mine.ok) throw new Error('setup failed');
    await repo.join(mine.value.inviteCode);
    as({ id: 'u1', displayName: 'Ana Lima' });

    await renderList(repo);

    expect(await screen.findByLabelText('Família')).toBeTruthy();
    expect(screen.getByLabelText('Trabalho')).toBeTruthy();
    expect(screen.queryByLabelText('Do Beto')).toBeNull();
    expect(screen.getByText('2 de 12 membros')).toBeTruthy();
    expect(screen.getByText('1 de 12 membros')).toBeTruthy();
  });

  it('opens the pressed circle', async () => {
    const { repo } = newRepo();
    await repo.create('Família');
    const { onOpen } = await renderList(repo);

    await fireEvent.press(await screen.findByLabelText('Família'));

    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Família' }),
    );
  });

  it('offers "Entrar com código" next to the list', async () => {
    const { repo } = newRepo();
    await repo.create('Família');
    const { onJoin } = await renderList(repo);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Entrar com código' }),
    );

    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  it('shows an error banner and recovers on retry (CIR-06)', async () => {
    const { repo } = newRepo();
    await repo.create('Família');
    jest
      .spyOn(repo, 'listMine')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderList(repo);

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByLabelText('Família')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
