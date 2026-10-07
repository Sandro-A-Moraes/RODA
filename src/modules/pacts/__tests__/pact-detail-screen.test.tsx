import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err, ok } from '@/core/errors';
import { localDay } from '@/shared/date/local-day';

import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import { pactRepositoryToken } from '../domain/pact-repository';
import { PactDetailScreen } from '../presentation/pact-detail-screen';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

const offline = 'Sem conexão. Verifique sua internet e tente novamente.';

async function setup(members = 3) {
  let current = 'u1';
  const repo = new InMemoryPactRepository(
    () => current,
    () => members,
  );
  const created = await repo.create('c1', {
    title: 'Sem celular nas refeições',
    description: 'Guardar o celular durante almoço e jantar.',
  });
  if (!created.ok) throw new Error('setup failed');
  return {
    repo,
    pactId: created.value.id,
    as: (id: string) => {
      current = id;
    },
  };
}

async function renderDetail(
  repo: InMemoryPactRepository,
  pactId: string,
  currentUserId = 'u1',
) {
  const onBack = jest.fn();
  const onEdit = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(pactRepositoryToken, repo)]}>
      <PactDetailScreen
        pactId={pactId}
        currentUserId={currentUserId}
        onBack={onBack}
        onEdit={onEdit}
      />
    </DependencyProvider>,
  );
  return { onBack, onEdit };
}

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));

describe('PactDetailScreen progress', () => {
  it('shows the pact, "X de N" and the percentage (PACT-06)', async () => {
    const { repo, pactId, as } = await setup(3);
    await repo.checkIn(pactId, localDay());
    as('u2');
    await repo.checkIn(pactId, localDay());

    await renderDetail(repo, pactId);

    expect(await screen.findByText('Sem celular nas refeições')).toBeTruthy();
    expect(
      screen.getByText('Guardar o celular durante almoço e jantar.'),
    ).toBeTruthy();
    expect(screen.getByText('2 de 3')).toBeTruthy();
    expect(screen.getByText('fizeram o check-in')).toBeTruthy();
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 67,
    });
  });

  it('shows 0% for a circle without members (PACT-06)', async () => {
    const { repo, pactId } = await setup(0);

    await renderDetail(repo, pactId);

    expect(await screen.findByText('0 de 0')).toBeTruthy();
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(
      0,
    );
  });

  it('states that only the group total is shown, with no member names (PACT-05)', async () => {
    const { repo, pactId } = await setup();

    await renderDetail(repo, pactId);

    expect(
      await screen.findByText(
        'Mostramos só o total do grupo, nunca quem fez ou quem não fez.',
      ),
    ).toBeTruthy();
  });

  it('shows a loading indicator while the pact loads', async () => {
    const { repo, pactId } = await setup();
    jest.spyOn(repo, 'get').mockReturnValue(new Promise(() => {}));

    await renderDetail(repo, pactId);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('shows a not_found message for a missing pact (PACT-09)', async () => {
    const { repo } = await setup();
    await renderDetail(repo, 'missing');

    expect(
      await screen.findByText('Não encontramos o que você procura.'),
    ).toBeTruthy();
  });

  it('shows a load failure with a retry', async () => {
    const { repo, pactId } = await setup();
    jest
      .spyOn(repo, 'get')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderDetail(repo, pactId);

    expect(await screen.findByText(offline)).toBeTruthy();
    await press('Tentar novamente');

    expect(await screen.findByText('Sem celular nas refeições')).toBeTruthy();
  });
});

describe('PactDetailScreen check-in', () => {
  it('records the check-in, updates the progress and disables the button (PACT-03, PACT-07)', async () => {
    const { repo, pactId } = await setup(3);
    const checkIn = jest.spyOn(repo, 'checkIn');
    await renderDetail(repo, pactId);

    expect(await screen.findByText('0 de 3')).toBeTruthy();
    await press('Fazer check-in');

    expect(await screen.findByText('1 de 3')).toBeTruthy();
    expect(checkIn).toHaveBeenCalledWith(pactId, localDay());
    const done = screen.getByRole('button', { name: 'Check-in feito hoje' });
    expect(done.props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Fazer check-in' })).toBeNull();
  });

  it('opens already done when I checked in earlier today (PACT-03)', async () => {
    const { repo, pactId } = await setup();
    await repo.checkIn(pactId, localDay());

    await renderDetail(repo, pactId);

    const done = await screen.findByRole('button', {
      name: 'Check-in feito hoje',
    });
    expect(done.props.accessibilityState.disabled).toBe(true);
  });

  it('records exactly one check-in when the button is tapped twice quickly (PACT-03)', async () => {
    const { repo, pactId } = await setup();
    let release: () => void = () => undefined;
    const checkIn = jest.spyOn(repo, 'checkIn').mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(ok(undefined));
        }),
    );
    await renderDetail(repo, pactId);
    await screen.findByText('0 de 3');

    await press('Fazer check-in');
    await press('Fazer check-in');
    release();

    await screen.findByRole('button', { name: 'Fazer check-in' });
    expect(checkIn).toHaveBeenCalledTimes(1);
  });

  it('shows the failure message and keeps the button available for retry (PACT-04)', async () => {
    const { repo, pactId } = await setup();
    jest
      .spyOn(repo, 'checkIn')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderDetail(repo, pactId);
    await screen.findByText('0 de 3');

    await press('Fazer check-in');

    expect(await screen.findByText(offline)).toBeTruthy();
    const retry = screen.getByRole('button', { name: 'Fazer check-in' });
    expect(retry.props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(retry);

    expect(await screen.findByText('1 de 3')).toBeTruthy();
    expect(screen.queryByText(offline)).toBeNull();
  });
});

describe('PactDetailScreen creator controls', () => {
  it('shows edit and delete only to the creator (PACT-08, PACT-09)', async () => {
    const { repo, pactId } = await setup();
    const { onEdit } = await renderDetail(repo, pactId, 'u1');

    await screen.findByText('Sem celular nas refeições');
    await press('Editar pacto');

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Apagar pacto' })).toBeTruthy();
  });

  it('hides edit and delete from other members (PACT-08, PACT-09)', async () => {
    const { repo, pactId } = await setup();

    await renderDetail(repo, pactId, 'u2');

    await screen.findByText('Sem celular nas refeições');
    expect(screen.queryByRole('button', { name: 'Editar pacto' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Apagar pacto' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Fazer check-in' })).toBeTruthy();
  });

  it('asks for confirmation before deleting (PACT-09)', async () => {
    const { repo, pactId } = await setup();
    const remove = jest.spyOn(repo, 'remove');
    await renderDetail(repo, pactId);
    await screen.findByText('Sem celular nas refeições');

    await press('Apagar pacto');

    expect(await screen.findByText('Apagar este pacto?')).toBeTruthy();
    expect(
      screen.getByText(
        'Os check-ins do pacto também serão apagados. Isso não pode ser desfeito.',
      ),
    ).toBeTruthy();
    expect(remove).not.toHaveBeenCalled();
  });

  it('keeps the pact when the confirmation is cancelled (PACT-09)', async () => {
    const { repo, pactId } = await setup();
    const remove = jest.spyOn(repo, 'remove');
    const { onBack } = await renderDetail(repo, pactId);
    await screen.findByText('Sem celular nas refeições');
    await press('Apagar pacto');
    await screen.findByText('Apagar este pacto?');

    await press('Cancelar');

    expect(screen.queryByText('Apagar este pacto?')).toBeNull();
    expect(remove).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
    expect((await repo.get(pactId, localDay())).ok).toBe(true);
  });

  it('removes the pact and goes back when deletion is confirmed (PACT-09)', async () => {
    const { repo, pactId } = await setup();
    const { onBack } = await renderDetail(repo, pactId);
    await screen.findByText('Sem celular nas refeições');
    await press('Apagar pacto');
    await screen.findByText('Apagar este pacto?');

    await press('Apagar');

    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect((await repo.get(pactId, localDay())).ok).toBe(false);
    const list = await repo.listByCircle('c1', localDay());
    expect(list.ok && list.value).toEqual([]);
  });

  it('shows the not_found message when the pact was already deleted (PACT-09)', async () => {
    const { repo, pactId } = await setup();
    const { onBack } = await renderDetail(repo, pactId);
    await screen.findByText('Sem celular nas refeições');
    await repo.remove(pactId);
    await press('Apagar pacto');
    await screen.findByText('Apagar este pacto?');

    await press('Apagar');

    expect(
      await screen.findByText('Não encontramos o que você procura.'),
    ).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
  });
});
