import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryStoryRepository } from '../data/in-memory-story-repository';
import { storyRepositoryToken } from '../domain/story-repository';
import { StoryComposerScreen } from '../presentation/story-composer-screen';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

// The device's local day, controllable so a day rollover can be simulated.
let mockToday = '2026-10-07';
jest.mock('@/shared/date/local-day', () => {
  const actual = jest.requireActual<typeof import('@/shared/date/local-day')>(
    '@/shared/date/local-day',
  );
  return { ...actual, localDay: () => mockToday };
});

const ALREADY = 'Você já compartilhou hoje';
const EMPTY = 'Escreva algo para compartilhar';
const TOO_LONG = 'Máximo de 280 caracteres';
const FIELD = 'Seu relato';

function setup() {
  let me = 'u1';
  const repo = new InMemoryStoryRepository(
    () => me,
    (userId) => ({ u1: 'Ana Souza', u2: 'Beto Lima' })[userId] ?? '',
  );
  return {
    repo,
    as: (id: string) => {
      me = id;
    },
  };
}

async function renderComposer(repo: InMemoryStoryRepository) {
  const onSaved = jest.fn();
  const onBack = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(storyRepositoryToken, repo)]}>
      <StoryComposerScreen circleId="c1" onBack={onBack} onSaved={onSaved} />
    </DependencyProvider>,
  );
  return { onSaved, onBack };
}

const typeBody = async (value: string) =>
  fireEvent.changeText(await screen.findByLabelText(FIELD), value);
const share = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Compartilhar' }));

async function myStoriesToday(repo: InMemoryStoryRepository) {
  const listed = await repo.listByCircle('c1', mockToday);
  if (!listed.ok) throw new Error('list failed');
  return listed.value.filter((s) => s.isMine && s.day === mockToday);
}

beforeEach(() => {
  mockToday = '2026-10-07';
});

describe('StoryComposerScreen', () => {
  it('counts the characters as "N de 280" (STORY-01)', async () => {
    await renderComposer(setup().repo);

    await screen.findByLabelText(FIELD);
    expect(screen.getByText('0 de 280')).toBeTruthy();
    await typeBody('Guardar o celular');

    expect(screen.getByText('17 de 280')).toBeTruthy();
  });

  it('saves the trimmed story for the local day and the feed shows it (STORY-01 AC1)', async () => {
    const { repo } = setup();
    const create = jest.spyOn(repo, 'create');
    const { onSaved } = await renderComposer(repo);

    await typeBody('  Caminhei sem o celular.  ');
    await share();

    await screen.findByLabelText(FIELD);
    expect(create).toHaveBeenCalledWith(
      'c1',
      'Caminhei sem o celular.',
      '2026-10-07',
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    const mine = await myStoriesToday(repo);
    expect(mine.map((s) => s.body)).toEqual(['Caminhei sem o celular.']);
  });

  it('accepts exactly 280 characters (STORY-01 AC1)', async () => {
    const { repo } = setup();
    const create = jest.spyOn(repo, 'create');
    const { onSaved } = await renderComposer(repo);

    await typeBody('x'.repeat(280));
    await share();

    await screen.findByLabelText(FIELD);
    expect(create).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it.each(['', '   ', ' \n\n \t '])(
    'shows "Escreva algo para compartilhar" and does not save %p (STORY-01 AC2)',
    async (body) => {
      const { repo } = setup();
      const create = jest.spyOn(repo, 'create');
      const { onSaved } = await renderComposer(repo);

      await typeBody(body);
      await share();

      expect(await screen.findByText(EMPTY)).toBeTruthy();
      expect(create).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    },
  );

  it('shows "Máximo de 280 caracteres" and does not save 281 (STORY-01 AC3)', async () => {
    const { repo } = setup();
    const create = jest.spyOn(repo, 'create');
    const { onSaved } = await renderComposer(repo);

    await typeBody('x'.repeat(281));
    await share();

    expect(await screen.findByText(TOO_LONG)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('rejects a second story the same day with "Você já compartilhou hoje" (STORY-02 AC4)', async () => {
    const { repo } = setup();
    const { onSaved } = await renderComposer(repo);
    await screen.findByLabelText(FIELD);
    // Posted from another device while this composer was open.
    await repo.create('c1', 'Primeiro relato', mockToday);

    await typeBody('Segundo relato');
    await share();

    expect(await screen.findByText(ALREADY)).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
    const mine = await myStoriesToday(repo);
    expect(mine.map((s) => s.body)).toEqual(['Primeiro relato']);
  });

  it('replaces the composer with the notice when I already posted today (STORY-02 AC5)', async () => {
    const { repo } = setup();
    await repo.create('c1', 'Já contei', mockToday);

    await renderComposer(repo);

    expect(await screen.findByText(ALREADY)).toBeTruthy();
    expect(screen.queryByLabelText(FIELD)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).toBeNull();
  });

  it('keeps the composer when my last story is from yesterday (STORY-02 AC5)', async () => {
    const { repo, as } = setup();
    await repo.create('c1', 'Ontem', '2026-10-06');
    as('u2');
    await repo.create('c1', 'Outra pessoa hoje', mockToday);
    as('u1');

    await renderComposer(repo);

    expect(await screen.findByLabelText(FIELD)).toBeTruthy();
    expect(screen.queryByText(ALREADY)).toBeNull();
  });

  it('evaluates the daily rule against the date at submit time (edge case: day rollover)', async () => {
    const { repo } = setup();
    const create = jest.spyOn(repo, 'create');
    // Opened late on the 7th, submitted after midnight.
    const { onSaved } = await renderComposer(repo);
    await typeBody('Depois da meia-noite');
    mockToday = '2026-10-08';

    await share();

    await screen.findByLabelText(FIELD);
    expect(create).toHaveBeenCalledWith(
      'c1',
      'Depois da meia-noite',
      '2026-10-08',
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('shows a load failure with a retry instead of the composer', async () => {
    const { repo } = setup();
    jest
      .spyOn(repo, 'listByCircle')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderComposer(repo);

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText(FIELD)).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByLabelText(FIELD)).toBeTruthy();
  });

  it('goes back from the header', async () => {
    const { onBack } = await renderComposer(setup().repo);

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
