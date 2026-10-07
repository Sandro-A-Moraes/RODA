import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';
import { daysAgo, localDay } from '@/shared/date/local-day';

import { InMemoryStoryRepository } from '../data/in-memory-story-repository';
import { storyRepositoryToken } from '../domain/story-repository';
import { StoriesView } from '../presentation/stories-view';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

const END = 'você chegou ao fim';
const names: Record<string, string> = {
  u1: 'Ana Souza',
  u2: 'Beto Lima',
  u3: 'Carla Dias',
};

function setup() {
  let me = 'u1';
  const repo = new InMemoryStoryRepository(
    () => me,
    (userId) => names[userId] ?? '',
  );
  return {
    repo,
    as: (id: string) => {
      me = id;
    },
  };
}

async function renderView(repo: InMemoryStoryRepository) {
  await render(
    <DependencyProvider provisions={[provide(storyRepositoryToken, repo)]}>
      <StoriesView circleId="c1" />
    </DependencyProvider>,
  );
}

// Every rendered text, in tree order.
const allTexts = () =>
  screen
    .getAllByText(/.+/)
    .map((node) => [node.props.children].flat().join(''));

describe('StoriesView (feed)', () => {
  it('shows a loading indicator while the feed loads (STORY-04 AC3)', async () => {
    const { repo } = setup();
    jest.spyOn(repo, 'listByCircle').mockReturnValue(new Promise(() => {}));

    await renderView(repo);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
    expect(screen.queryByText(END)).toBeNull();
  });

  it('shows the empty state without the end marker (STORY-04 AC4)', async () => {
    const { repo } = setup();

    await renderView(repo);

    expect(await screen.findByText('Ninguém compartilhou ainda')).toBeTruthy();
    expect(screen.queryByText(END)).toBeNull();
  });

  it('shows an error banner and reloads on retry (STORY-04 AC5)', async () => {
    const { repo, as } = setup();
    as('u2');
    await repo.create('c1', 'Jantar em família sem tela.', localDay());
    as('u1');
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

    expect(await screen.findByText('Jantar em família sem tela.')).toBeTruthy();
  });

  it('lists the last 7 days newest first, ending with the end marker (STORY-03 AC1-2)', async () => {
    const { repo, as } = setup();
    as('u3');
    await repo.create('c1', 'Fora da janela', daysAgo(7));
    await repo.create('c1', 'Seis dias atrás', daysAgo(6));
    as('u2');
    await repo.create('c1', 'Ontem', daysAgo(1));
    as('u3');
    await repo.create('c1', 'Hoje cedo', localDay());
    await repo.create('c2', 'Outro círculo', localDay());
    as('u1');

    await renderView(repo);

    await screen.findByText('Hoje cedo');
    const texts = allTexts();
    const bodies = texts.filter((t) =>
      ['Hoje cedo', 'Ontem', 'Seis dias atrás'].includes(t),
    );
    expect(bodies).toEqual(['Hoje cedo', 'Ontem', 'Seis dias atrás']);
    expect(screen.queryByText('Fora da janela')).toBeNull();
    expect(screen.queryByText('Outro círculo')).toBeNull();
    expect(texts[texts.length - 1]).toBe(END);
  });

  it('shows each story author name and local date (STORY-03 AC7)', async () => {
    const { repo, as } = setup();
    const threeDaysAgo = daysAgo(3);
    const [, month, day] = threeDaysAgo.split('-');
    as('u3');
    await repo.create('c1', 'Três dias', threeDaysAgo);
    as('u2');
    await repo.create('c1', 'De ontem', daysAgo(1));
    as('u1');
    await repo.create('c1', 'De hoje', localDay());

    await renderView(repo);

    await screen.findByText('De hoje');
    const texts = allTexts();
    const at = (body: string) => texts.indexOf(body);
    expect(texts.slice(at('De hoje') - 2, at('De hoje'))).toEqual([
      'Ana Souza',
      'hoje',
    ]);
    expect(texts.slice(at('De ontem') - 2, at('De ontem'))).toEqual([
      'Beto Lima',
      'ontem',
    ]);
    expect(texts.slice(at('Três dias') - 2, at('Três dias'))).toEqual([
      'Carla Dias',
      `${day}/${month}`,
    ]);
  });

  it('shows the "Você já compartilhou hoje" notice only after I posted today (STORY-02 AC5)', async () => {
    const { repo, as } = setup();
    await repo.create('c1', 'Meu relato de ontem', daysAgo(1));
    as('u2');
    await repo.create('c1', 'Relato do Beto hoje', localDay());
    as('u1');

    await renderView(repo);
    await screen.findByText('Relato do Beto hoje');
    expect(screen.queryByText('Você já compartilhou hoje')).toBeNull();

    await repo.create('c1', 'Meu relato de hoje', localDay());
    await screen.unmount();
    await renderView(repo);

    expect(await screen.findByText('Você já compartilhou hoje')).toBeTruthy();
    const texts = allTexts();
    expect(texts[texts.length - 1]).toBe(END);
  });

  it('shows no numeric counter on any story (STORY-05)', async () => {
    const { repo, as } = setup();
    as('u2');
    await repo.create('c1', 'Caminhei sem celular', localDay());
    as('u3');
    await repo.create('c1', 'Li um livro', daysAgo(1));
    as('u1');

    await renderView(repo);

    await screen.findByText('Caminhei sem celular');
    expect(screen.queryByText(/\d/)).toBeNull();
  });
});
