import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';

import { InMemoryMeetupRepository } from '../data/in-memory-meetup-repository';
import { meetupRepositoryToken } from '../domain/meetup-repository';
import { MeetupFormScreen } from '../presentation/meetup-form-screen';

const pad = (n: number) => String(n).padStart(2, '0');
const dateText = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const nextWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

function setup() {
  const repo = new InMemoryMeetupRepository(
    () => 'u1',
    () => 'Ana Souza',
  );
  const onSaved = jest.fn();
  const onBack = jest.fn();
  return { repo, onSaved, onBack };
}

async function renderForm(ctx: ReturnType<typeof setup>) {
  await render(
    <DependencyProvider provisions={[provide(meetupRepositoryToken, ctx.repo)]}>
      <MeetupFormScreen
        circleId="c1"
        onBack={ctx.onBack}
        onSaved={ctx.onSaved}
      />
    </DependencyProvider>,
  );
}

async function fill(values: {
  title?: string;
  place?: string;
  date?: string;
  time?: string;
}) {
  const fields = {
    Título: values.title,
    Local: values.place,
    Data: values.date,
    Hora: values.time,
  };
  for (const [label, text] of Object.entries(fields)) {
    if (text !== undefined)
      await fireEvent.changeText(screen.getByLabelText(label), text);
  }
}

const valid = () => ({
  title: 'Piquenique',
  place: 'Praça da República',
  date: dateText(nextWeek()),
  time: '09:30',
});

describe('MeetupFormScreen', () => {
  it('creates the meetup and calls onSaved (MEET-01 AC1)', async () => {
    const ctx = setup();
    await renderForm(ctx);

    await fill(valid());
    await fireEvent.press(screen.getByLabelText('Propor encontro'));

    await waitFor(() => expect(ctx.onSaved).toHaveBeenCalledTimes(1));
    const listed = await ctx.repo.listUpcoming('c1', new Date());
    expect(listed.ok && listed.value.map((m) => m.title)).toEqual([
      'Piquenique',
    ]);
  });

  it.each([
    ['title', { title: 'ab' }, 'Título deve ter entre 3 e 60 caracteres'],
    ['place', { place: 'ab' }, 'Local deve ter entre 3 e 100 caracteres'],
    ['date', { date: '31/02/2030' }, 'Data ou hora inválida'],
    ['time', { time: '25:00' }, 'Data ou hora inválida'],
    ['past', { date: '01/01/2020' }, 'A data deve ser no futuro'],
  ])(
    'shows the %s message and does not create (MEET-02)',
    async (_n, patch, message) => {
      const ctx = setup();
      await renderForm(ctx);

      await fill({ ...valid(), ...patch });
      await fireEvent.press(screen.getByLabelText('Propor encontro'));

      expect(await screen.findByText(message)).toBeTruthy();
      expect(ctx.onSaved).not.toHaveBeenCalled();
      expect(await ctx.repo.listUpcoming('c1', new Date())).toEqual({
        ok: true,
        value: [],
      });
    },
  );
});
