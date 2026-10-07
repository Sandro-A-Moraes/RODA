import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';
import { localDay } from '@/shared/date/local-day';

import { InMemoryStoryRepository } from '../data/in-memory-story-repository';
import { storyRepositoryToken } from '../domain/story-repository';
import type { ReactionKind } from '../domain/story-repository';
import { StoriesView } from '../presentation/stories-view';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

const WITH_YOU = 'Estou com você';
const INSPIRED = 'Me inspirou';
const BODY = 'Jantar em família sem tela.';

function setup() {
  let me = 'u2';
  const repo = new InMemoryStoryRepository(
    () => me,
    (userId) =>
      ({ u1: 'Ana Souza', u2: 'Beto Lima', u3: 'Carla Dias' })[userId] ?? '',
  );
  return {
    repo,
    as: (id: string) => {
      me = id;
    },
  };
}

// u2 posts; the feed is then viewed by `viewer`.
async function seed(viewer = 'u1') {
  const ctx = setup();
  const created = await ctx.repo.create('c1', BODY, localDay());
  if (!created.ok) throw new Error('setup failed');
  ctx.as(viewer);
  return { ...ctx, storyId: created.value.id };
}

async function renderView(repo: InMemoryStoryRepository) {
  await render(
    <DependencyProvider provisions={[provide(storyRepositoryToken, repo)]}>
      <StoriesView circleId="c1" />
    </DependencyProvider>,
  );
  await screen.findByText(BODY);
}

const chip = (name: string) => screen.getByRole('button', { name });
const isSelected = (name: string) =>
  chip(name).props.accessibilityState?.selected === true;

async function myReaction(
  repo: InMemoryStoryRepository,
): Promise<ReactionKind | null> {
  const listed = await repo.listByCircle('c1', localDay());
  if (!listed.ok) throw new Error('list failed');
  return listed.value[0].myReaction;
}

describe('Reaction controls', () => {
  it('records a tapped kind and shows it selected (STORY-06 AC1)', async () => {
    const { repo } = await seed();
    await renderView(repo);
    expect(isSelected(WITH_YOU)).toBe(false);
    expect(isSelected(INSPIRED)).toBe(false);

    await fireEvent.press(chip(WITH_YOU));

    expect(isSelected(WITH_YOU)).toBe(true);
    expect(isSelected(INSPIRED)).toBe(false);
    expect(await myReaction(repo)).toBe('with_you');
  });

  it('replaces the reaction when another kind is tapped (STORY-06 AC2)', async () => {
    const { repo, storyId } = await seed();
    await repo.react(storyId, 'with_you');
    await renderView(repo);
    expect(isSelected(WITH_YOU)).toBe(true);

    await fireEvent.press(chip(INSPIRED));

    expect(isSelected(INSPIRED)).toBe(true);
    expect(isSelected(WITH_YOU)).toBe(false);
    expect(await myReaction(repo)).toBe('inspired');
  });

  it('removes the reaction when the selected kind is tapped again (STORY-06 AC3)', async () => {
    const { repo, storyId } = await seed();
    await repo.react(storyId, 'inspired');
    await renderView(repo);

    await fireEvent.press(chip(INSPIRED));

    expect(isSelected(INSPIRED)).toBe(false);
    expect(isSelected(WITH_YOU)).toBe(false);
    expect(await myReaction(repo)).toBeNull();
  });

  it('shows no reaction controls on my own story (STORY-06 AC4)', async () => {
    const { repo } = await seed('u2');
    await renderView(repo);

    expect(screen.queryByRole('button', { name: WITH_YOU })).toBeNull();
    expect(screen.queryByRole('button', { name: INSPIRED })).toBeNull();
  });

  it('shows the author which kinds were received, without numbers (STORY-07 AC5)', async () => {
    const { repo, as, storyId } = await seed();
    await repo.react(storyId, 'with_you');
    as('u3');
    await repo.react(storyId, 'with_you');
    as('u2');
    await renderView(repo);

    expect(screen.getByText(`Recebeu: ${WITH_YOU}`)).toBeTruthy();
    expect(screen.queryByText(/\d/)).toBeNull();

    as('u1');
    await repo.react(storyId, 'inspired');
    as('u2');
    await screen.unmount();
    await renderView(repo);

    expect(screen.getByText(`Recebeu: ${WITH_YOU} · ${INSPIRED}`)).toBeTruthy();
    expect(screen.queryByText(/\d/)).toBeNull();
  });

  it('shows nothing received on my story before any reaction (STORY-07 AC5)', async () => {
    const { repo } = await seed('u2');
    await renderView(repo);

    expect(screen.queryByText(/Recebeu/)).toBeNull();
  });

  it('does not show received kinds to other members (STORY-07 AC5)', async () => {
    const { repo, as, storyId } = await seed('u3');
    await repo.react(storyId, 'inspired');
    as('u1');
    await renderView(repo);

    expect(screen.queryByText(/Recebeu/)).toBeNull();
  });

  it('shows the error and restores the previous selection on failure (STORY-07 AC6)', async () => {
    const { repo, storyId } = await seed();
    await repo.react(storyId, 'with_you');
    jest
      .spyOn(repo, 'react')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderView(repo);

    await fireEvent.press(chip(INSPIRED));

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    expect(isSelected(WITH_YOU)).toBe(true);
    expect(isSelected(INSPIRED)).toBe(false);
    expect(await myReaction(repo)).toBe('with_you');
  });
});
