import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';
import { localDay } from '@/shared/date/local-day';

import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import { pactRepositoryToken } from '../domain/pact-repository';
import { PactsView } from '../presentation/pacts-view';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

function setup(members = 3) {
  let current = 'u1';
  const repo = new InMemoryPactRepository(
    () => current,
    () => members,
  );
  return {
    repo,
    as: (id: string) => {
      current = id;
    },
  };
}

async function renderView(repo: InMemoryPactRepository) {
  const onOpenPact = jest.fn();
  const onCreate = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(pactRepositoryToken, repo)]}>
      <PactsView circleId="c1" onOpenPact={onOpenPact} onCreate={onCreate} />
    </DependencyProvider>,
  );
  return { onOpenPact, onCreate };
}

describe('PactsView', () => {
  it('shows a loading indicator while the list loads (PACT-02)', async () => {
    const { repo } = setup();
    jest.spyOn(repo, 'listByCircle').mockReturnValue(new Promise(() => {}));

    await renderView(repo);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('shows the empty state with a "Criar pacto" action (PACT-02)', async () => {
    const { repo } = setup();
    const { onCreate } = await renderView(repo);

    await screen.findByText('Nenhum pacto ainda');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar pacto' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('shows an error banner and reloads on retry (PACT-02)', async () => {
    const { repo } = setup();
    await repo.create('c1', { title: 'Sem celular', description: '' });
    jest
      .spyOn(repo, 'listByCircle')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderView(repo);

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByText('Sem celular')).toBeTruthy();
  });

  it('lists only this circle pacts, oldest first (PACT-02)', async () => {
    const { repo } = setup();
    await repo.create('c1', { title: 'Primeiro pacto', description: '' });
    await repo.create('c2', { title: 'Pacto de outro círculo', description: '' });
    await repo.create('c1', { title: 'Segundo pacto', description: '' });

    await renderView(repo);

    await screen.findByText('Primeiro pacto');
    const titles = screen
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel);
    expect(titles).toEqual(['Primeiro pacto', 'Segundo pacto']);
    expect(screen.queryByText('Pacto de outro círculo')).toBeNull();
  });

  it('shows "X de N hoje" and the rounded percent on each card (PACT-06)', async () => {
    const { repo, as } = setup(3);
    const created = await repo.create('c1', {
      title: 'Sem celular',
      description: 'Durante as refeições.',
    });
    if (!created.ok) throw new Error('setup failed');
    await repo.checkIn(created.value.id, localDay());
    as('u2');
    await repo.checkIn(created.value.id, localDay());

    await renderView(repo);

    expect(await screen.findByText('2 de 3 hoje')).toBeTruthy();
    expect(screen.getByText('67%')).toBeTruthy();
    expect(screen.getByText('Durante as refeições.')).toBeTruthy();
  });

  it('shows the "Feito hoje" badge only when I already checked in', async () => {
    const { repo, as } = setup();
    const created = await repo.create('c1', {
      title: 'Sem celular',
      description: '',
    });
    if (!created.ok) throw new Error('setup failed');
    await repo.checkIn(created.value.id, localDay());

    await renderView(repo);
    expect(await screen.findByText('Feito hoje')).toBeTruthy();

    as('u2');
    await screen.unmount();
    await renderView(repo);
    await screen.findByText('Sem celular');
    expect(screen.queryByText('Feito hoje')).toBeNull();
  });

  it('shows 0% when the circle has no members (PACT-06)', async () => {
    const { repo } = setup(0);
    await repo.create('c1', { title: 'Sem celular', description: '' });

    await renderView(repo);

    expect(await screen.findByText('0 de 0 hoje')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('opens a pact when its card is pressed', async () => {
    const { repo } = setup();
    const created = await repo.create('c1', {
      title: 'Sem celular',
      description: '',
    });
    if (!created.ok) throw new Error('setup failed');
    const { onOpenPact } = await renderView(repo);

    await fireEvent.press(await screen.findByLabelText('Sem celular'));

    expect(onOpenPact).toHaveBeenCalledWith(created.value.id);
  });

  it('never names members or ranks them (PACT-05)', async () => {
    const { repo } = setup();
    await repo.create('c1', { title: 'Sem celular', description: '' });

    await renderView(repo);

    await screen.findByText('Sem celular');
    expect(screen.queryByText(/ranking|u1|u2/i)).toBeNull();
  });
});
