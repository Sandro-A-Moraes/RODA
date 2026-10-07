import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import type { CurrentUser } from '../data/in-memory-circle-repository';
import { circleRepositoryToken } from '../domain/circle-repository';
import { MembersView } from '../presentation/members-view';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

async function setup() {
  let current: CurrentUser = { id: 'u1', displayName: 'Ana Lima' };
  const repo = new InMemoryCircleRepository(() => current);
  const as = (user: CurrentUser) => {
    current = user;
  };
  const created = await repo.create('Família');
  if (!created.ok) throw new Error('setup failed');
  return { repo, as, circle: created.value };
}

async function renderMembers(
  repo: InMemoryCircleRepository,
  circleId: string,
  currentUserId = 'u1',
) {
  await render(
    <DependencyProvider provisions={[provide(circleRepositoryToken, repo)]}>
      <MembersView circleId={circleId} currentUserId={currentUserId} />
    </DependencyProvider>,
  );
}

describe('MembersView', () => {
  it('shows the creator alone with "1 de 12" and the invite code (CIR-01, CIR-07)', async () => {
    const { repo, circle } = await setup();

    await renderMembers(repo, circle.id);

    expect(await screen.findByText('Ana Lima')).toBeTruthy();
    expect(screen.getByText('Você')).toBeTruthy();
    expect(screen.getByText('1 de 12 membros')).toBeTruthy();
    expect(
      screen.getByLabelText(`Código de convite ${circle.inviteCode}`),
    ).toBeTruthy();
    expect(circle.inviteCode).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  });

  it('offers to share and copy the invite code', async () => {
    const { repo, circle } = await setup();

    await renderMembers(repo, circle.id);

    expect(
      await screen.findByRole('button', { name: 'Compartilhar' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeTruthy();
  });

  it('lists every member by display name and the count (CIR-07)', async () => {
    const { repo, as, circle } = await setup();
    as({ id: 'u2', displayName: 'Beto Souza' });
    await repo.join(circle.inviteCode);
    as({ id: 'u3', displayName: 'Carla Dias' });
    await repo.join(circle.inviteCode);
    as({ id: 'u1', displayName: 'Ana Lima' });

    await renderMembers(repo, circle.id);

    expect(await screen.findByText('Beto Souza')).toBeTruthy();
    expect(screen.getByText('Ana Lima')).toBeTruthy();
    expect(screen.getByText('Carla Dias')).toBeTruthy();
    expect(screen.getByText('3 de 12 membros')).toBeTruthy();
    expect(screen.getAllByText('Você')).toHaveLength(1);
  });

  it('shows "12 de 12 membros" for a full circle (CIR-07)', async () => {
    const { repo, as, circle } = await setup();
    for (let i = 2; i <= 12; i += 1) {
      as({ id: `u${i}`, displayName: `Membro ${i}` });
      await repo.join(circle.inviteCode);
    }
    as({ id: 'u1', displayName: 'Ana Lima' });

    await renderMembers(repo, circle.id);

    expect(await screen.findByText('12 de 12 membros')).toBeTruthy();
  });

  it('shows no data for a circle the user does not belong to (CIR-08)', async () => {
    const { repo, as, circle } = await setup();
    as({ id: 'u9', displayName: 'Intruso' });

    await renderMembers(repo, circle.id, 'u9');

    expect(
      await screen.findByText('Não encontramos o que você procura.'),
    ).toBeTruthy();
    expect(screen.queryByText('Ana Lima')).toBeNull();
    expect(screen.queryByLabelText(/Código de convite/)).toBeNull();
  });

  it('shows a loading indicator, then an error with retry', async () => {
    const { repo, circle } = await setup();
    jest
      .spyOn(repo, 'members')
      .mockResolvedValueOnce(err(createAppError('network')));

    await renderMembers(repo, circle.id);

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(await screen.findByText('Ana Lima')).toBeTruthy();
  });

  it('shows a loading indicator while loading', async () => {
    const { repo, circle } = await setup();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const real = repo.members.bind(repo);
    jest.spyOn(repo, 'members').mockImplementation(async (id) => {
      await gate;
      return real(id);
    });

    await renderMembers(repo, circle.id);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
    release();
    expect(await screen.findByText('Ana Lima')).toBeTruthy();
    expect(screen.queryByLabelText('Carregando')).toBeNull();
  });
});
