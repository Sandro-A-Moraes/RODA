import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryMeetupRepository } from '../data/in-memory-meetup-repository';
import { longMoment } from '../domain/meetup-format';
import { meetupRepositoryToken } from '../domain/meetup-repository';
import { MeetupDetailScreen } from '../presentation/meetup-detail-screen';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

const names: Record<string, string> = {
  u1: 'Ana Souza',
  u2: 'Beto Lima',
  u3: 'Carla Alves',
};
const START = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

function setup() {
  let me = 'u1';
  const repo = new InMemoryMeetupRepository(
    () => me,
    (id) => names[id] ?? '',
  );
  return {
    repo,
    as: (id: string) => {
      me = id;
    },
  };
}

async function seed(repo: InMemoryMeetupRepository, as: (id: string) => void) {
  const created = await repo.create('c1', {
    title: 'Caminhada na orla',
    place: 'Praça da República',
    startsAt: START,
  });
  if (!created.ok) throw new Error('create failed');
  as('u2');
  await repo.setRsvp(created.value.id, 'going');
  as('u1');
  return created.value.id;
}

async function renderDetail(
  repo: InMemoryMeetupRepository,
  meetupId: string,
  currentUserId = 'u1',
  onBack: () => void = () => {},
) {
  await render(
    <DependencyProvider provisions={[provide(meetupRepositoryToken, repo)]}>
      <MeetupDetailScreen
        circleId="c1"
        meetupId={meetupId}
        currentUserId={currentUserId}
        onBack={onBack}
      />
    </DependencyProvider>,
  );
}

describe('MeetupDetailScreen', () => {
  it('shows the title, place and long date (MEET-04 AC3)', async () => {
    const { repo, as } = setup();
    const id = await seed(repo, as);

    await renderDetail(repo, id);

    expect(await screen.findByText('Caminhada na orla')).toBeTruthy();
    expect(screen.getByText('Praça da República')).toBeTruthy();
    expect(screen.getByText(longMoment(START))).toBeTruthy();
  });

  it('lists the names going with the count and marks the viewer (MEET-04 AC3)', async () => {
    const { repo, as } = setup();
    const id = await seed(repo, as);

    await renderDetail(repo, id, 'u1');

    expect(await screen.findByText('Quem vai')).toBeTruthy();
    expect(screen.getByText('2 confirmados')).toBeTruthy();
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('Beto Lima')).toBeTruthy();
    expect(screen.getAllByText('Você')).toHaveLength(1);
  });

  it('says 1 confirmado in the singular', async () => {
    const { repo } = setup();
    const created = await repo.create('c1', {
      title: 'Sozinho',
      place: 'Praça',
      startsAt: START,
    });
    if (!created.ok) throw new Error('create failed');

    await renderDetail(repo, created.value.id);

    expect(await screen.findByText('1 confirmado')).toBeTruthy();
  });

  it('records Não vou and drops the viewer from the list (MEET-04 AC2)', async () => {
    const { repo, as } = setup();
    const id = await seed(repo, as);

    await renderDetail(repo, id, 'u1');
    await fireEvent.press(await screen.findByLabelText('Não vou'));

    expect(await screen.findByText('1 confirmado')).toBeTruthy();
    expect(screen.queryByText('Ana Souza')).toBeNull();
  });

  it('records Eu vou for a member who had not answered (MEET-04 AC2)', async () => {
    const { repo, as } = setup();
    const id = await seed(repo, as);
    as('u3');

    await renderDetail(repo, id, 'u3');
    await fireEvent.press(await screen.findByLabelText('Eu vou'));

    expect(await screen.findByText('3 confirmados')).toBeTruthy();
    expect(screen.getByText('Carla Alves')).toBeTruthy();
  });

  it('shows the error with a retry when the RSVP fails (MEET-05 AC6)', async () => {
    const { repo, as } = setup();
    const id = await seed(repo, as);
    jest
      .spyOn(repo, 'setRsvp')
      .mockResolvedValueOnce(err(createAppError('network')));

    await renderDetail(repo, id);
    await fireEvent.press(await screen.findByLabelText('Não vou'));

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar novamente'));
    expect(await screen.findByText('1 confirmado')).toBeTruthy();
  });

  it('shows a loading indicator while loading (MEET-03 AC4)', async () => {
    const { repo } = setup();
    jest.spyOn(repo, 'listUpcoming').mockReturnValue(new Promise(() => {}));

    await renderDetail(repo, 'x');

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('shows the error with a retry when loading fails (MEET-05 AC6)', async () => {
    const { repo, as } = setup();
    const id = await seed(repo, as);
    const list = repo.listUpcoming.bind(repo);
    jest
      .spyOn(repo, 'listUpcoming')
      .mockResolvedValueOnce(err(createAppError('network')))
      .mockImplementation(list);

    await renderDetail(repo, id);

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar novamente'));
    expect(await screen.findByText('Caminhada na orla')).toBeTruthy();
  });

  it('explains when the meetup is no longer upcoming', async () => {
    const { repo } = setup();

    await renderDetail(repo, 'gone');

    expect(await screen.findByText('Encontro não encontrado')).toBeTruthy();
  });

  it('goes back from the header', async () => {
    const { repo } = setup();
    const onBack = jest.fn();

    await renderDetail(repo, 'gone', 'u1', onBack);
    await fireEvent.press(await screen.findByLabelText('Voltar'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
