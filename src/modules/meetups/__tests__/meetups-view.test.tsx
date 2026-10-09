import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryMeetupRepository } from '../data/in-memory-meetup-repository';
import { meetupRepositoryToken } from '../domain/meetup-repository';
import { weekdayTime } from '../domain/meetup-format';
import { MeetupsView } from '../presentation/meetups-view';

// useLoad refreshes on navigation focus; outside a navigator, mount is enough.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(effect, [effect]);
  },
}));

const names: Record<string, string> = { u1: 'Ana Souza', u2: 'Beto Lima' };
const DAY = 24 * 60 * 60 * 1000;

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

const tomorrow = (extraDays = 0) =>
  new Date(Date.now() + DAY * (1 + extraDays));

async function renderView(
  repo: InMemoryMeetupRepository,
  onPropose: () => void = () => {},
  onOpen: (meetupId: string) => void = () => {},
  currentUserId = 'u1',
) {
  await render(
    <DependencyProvider provisions={[provide(meetupRepositoryToken, repo)]}>
      <MeetupsView
        circleId="c1"
        currentUserId={currentUserId}
        onPropose={onPropose}
        onOpen={onOpen}
      />
    </DependencyProvider>,
  );
}

describe('MeetupsView', () => {
  it('shows a loading indicator while the list loads (MEET-03 AC4)', async () => {
    const { repo } = setup();
    jest.spyOn(repo, 'listUpcoming').mockReturnValue(new Promise(() => {}));

    await renderView(repo);

    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('shows the empty state with a Propor encontro action (MEET-03 AC5)', async () => {
    const { repo } = setup();
    const onPropose = jest.fn();

    await renderView(repo, onPropose);

    expect(await screen.findByText('Nenhum encontro marcado')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Propor encontro'));
    expect(onPropose).toHaveBeenCalledTimes(1);
  });

  it('lists upcoming meetups with title, place and moment, soonest first (MEET-03 AC1)', async () => {
    const { repo } = setup();
    await repo.create('c1', {
      title: 'Depois',
      place: 'Orla',
      startsAt: tomorrow(5),
    });
    await repo.create('c1', {
      title: 'Antes',
      place: 'Praça',
      startsAt: tomorrow(),
    });

    await renderView(repo);

    const titles = await screen.findAllByText(/^(Antes|Depois)$/);
    expect(titles.map((t) => t.props.children)).toEqual(['Antes', 'Depois']);
    expect(screen.getByText('Praça')).toBeTruthy();
    expect(screen.getByText(weekdayTime(tomorrow()))).toBeTruthy();
  });

  it('shows the calendar badge with the day and month', async () => {
    const { repo } = setup();
    await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: new Date(2030, 9, 12, 17, 0),
    });

    await renderView(repo);

    expect(await screen.findByText('12')).toBeTruthy();
    expect(screen.getByText('OUT')).toBeTruthy();
  });

  it('opens the meetup when its card is pressed (MEET-04 AC3)', async () => {
    const { repo } = setup();
    const created = await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: tomorrow(),
    });
    if (!created.ok) throw new Error('create failed');
    const onOpen = jest.fn();

    await renderView(repo, undefined, onOpen);
    await fireEvent.press(await screen.findByLabelText('Abrir Piquenique'));

    expect(onOpen).toHaveBeenCalledWith(created.value.id);
  });

  it('shows who is going and how many (MEET-04 AC3)', async () => {
    const { repo, as } = setup();
    const created = await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: tomorrow(),
    });
    if (!created.ok) throw new Error('create failed');
    as('u2');
    await repo.setRsvp(created.value.id, 'going');

    await renderView(repo, undefined, undefined, 'u9');

    expect(await screen.findByText('2 vão: Ana e Beto')).toBeTruthy();
  });

  it('says nobody confirmed when the only answer is not going', async () => {
    const { repo } = setup();
    const created = await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: tomorrow(),
    });
    if (!created.ok) throw new Error('create failed');
    await repo.setRsvp(created.value.id, 'not_going');

    await renderView(repo);

    expect(await screen.findByText('Ninguém confirmou ainda')).toBeTruthy();
  });

  it('records Eu vou, refreshes the names and marks the choice (MEET-04 AC2)', async () => {
    const { repo, as } = setup();
    await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: tomorrow(),
    });
    as('u2');

    await renderView(repo, undefined, undefined, 'u2');
    await fireEvent.press(await screen.findByLabelText('Eu vou'));

    expect(await screen.findByText('2 vão: Ana e você')).toBeTruthy();
    expect(screen.getByLabelText('Eu vou').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByLabelText('Não vou').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  it('records Não vou and removes the member from the going list', async () => {
    const { repo } = setup();
    await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: tomorrow(),
    });

    await renderView(repo);
    await fireEvent.press(await screen.findByLabelText('Não vou'));

    expect(await screen.findByText('Ninguém confirmou ainda')).toBeTruthy();
    expect(screen.getByLabelText('Não vou').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  it('shows the error with a retry when loading fails (MEET-05 AC6)', async () => {
    const { repo } = setup();
    jest
      .spyOn(repo, 'listUpcoming')
      .mockResolvedValueOnce(err(createAppError('network')))
      .mockResolvedValue({ ok: true, value: [] });

    await renderView(repo);

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar novamente'));
    expect(await screen.findByText('Nenhum encontro marcado')).toBeTruthy();
  });

  it('shows the error with a retry when recording the RSVP fails (MEET-05 AC6)', async () => {
    const { repo, as } = setup();
    await repo.create('c1', {
      title: 'Piquenique',
      place: 'Praça',
      startsAt: tomorrow(),
    });
    as('u2');
    jest
      .spyOn(repo, 'setRsvp')
      .mockResolvedValueOnce(err(createAppError('network')));

    await renderView(repo, undefined, undefined, 'u2');
    await fireEvent.press(await screen.findByLabelText('Eu vou'));

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tentar novamente'));
    expect(await screen.findByText('2 vão: Ana e você')).toBeTruthy();
  });
});
