import { InMemoryMeetupRepository } from '../data/in-memory-meetup-repository';

const NOW = new Date(2026, 9, 9, 12, 0);
const names: Record<string, string> = { u1: 'Ana Souza', u2: 'Beto Lima' };

function setup(isMember?: (circleId: string, userId: string) => boolean) {
  let me: string | null = 'u1';
  const repo = new InMemoryMeetupRepository(
    () => me,
    (id) => names[id] ?? '',
    isMember,
  );
  return {
    repo,
    as: (id: string | null) => {
      me = id;
    },
  };
}

const at = (day: number, hour = 10) => new Date(2026, 9, day, hour, 0);
const input = (title: string, startsAt: Date) => ({
  title,
  place: 'Praça',
  startsAt,
});

async function titles(repo: InMemoryMeetupRepository, now = NOW) {
  const result = await repo.listUpcoming('c1', now);
  if (!result.ok) throw new Error('list failed');
  return result.value.map((m) => m.title);
}

describe('InMemoryMeetupRepository', () => {
  it('creates a meetup with the creator going (MEET-01 AC1)', async () => {
    const { repo } = setup();

    const result = await repo.create('c1', input('Piquenique', at(10)));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      circleId: 'c1',
      title: 'Piquenique',
      place: 'Praça',
      startsAt: at(10),
      createdBy: 'u1',
      goingNames: ['Ana Souza'],
      myRsvp: 'going',
    });
  });

  it('lists only upcoming meetups of the circle, soonest first (MEET-03 AC1)', async () => {
    const { repo } = setup();
    await repo.create('c1', input('Depois', at(20)));
    await repo.create('c1', input('Antes', at(10)));
    await repo.create('c2', input('Outro círculo', at(11)));

    expect(await titles(repo)).toEqual(['Antes', 'Depois']);
  });

  it('stops listing a meetup once its start time passes', async () => {
    const { repo } = setup();
    await repo.create('c1', input('Piquenique', at(10, 10)));

    expect(await titles(repo, at(10, 9))).toEqual(['Piquenique']);
    expect(await titles(repo, at(10, 10))).toEqual([]);
    expect(await titles(repo, at(10, 11))).toEqual([]);
  });

  it('records a going RSVP and shows the name to everyone (MEET-04 AC2, AC3)', async () => {
    const { repo, as } = setup();
    const created = await repo.create('c1', input('Piquenique', at(10)));
    if (!created.ok) throw new Error('create failed');

    as('u2');
    expect((await repo.setRsvp(created.value.id, 'going')).ok).toBe(true);

    const mine = await repo.listUpcoming('c1', NOW);
    if (!mine.ok) throw new Error('list failed');
    expect(mine.value[0].goingNames).toEqual(['Ana Souza', 'Beto Lima']);
    expect(mine.value[0].myRsvp).toBe('going');

    as('u1');
    const theirs = await repo.listUpcoming('c1', NOW);
    if (!theirs.ok) throw new Error('list failed');
    expect(theirs.value[0].goingNames).toEqual(['Ana Souza', 'Beto Lima']);
  });

  it('replaces an earlier RSVP by the same member (MEET-04 AC2)', async () => {
    const { repo } = setup();
    const created = await repo.create('c1', input('Piquenique', at(10)));
    if (!created.ok) throw new Error('create failed');

    await repo.setRsvp(created.value.id, 'not_going');

    const listed = await repo.listUpcoming('c1', NOW);
    if (!listed.ok) throw new Error('list failed');
    expect(listed.value[0].goingNames).toEqual([]);
    expect(listed.value[0].myRsvp).toBe('not_going');
  });

  it('keeps exactly one RSVP when the same answer is sent twice', async () => {
    const { repo, as } = setup();
    const created = await repo.create('c1', input('Piquenique', at(10)));
    if (!created.ok) throw new Error('create failed');
    as('u2');

    await repo.setRsvp(created.value.id, 'going');
    await repo.setRsvp(created.value.id, 'going');

    const listed = await repo.listUpcoming('c1', NOW);
    if (!listed.ok) throw new Error('list failed');
    expect(listed.value[0].goingNames).toEqual(['Ana Souza', 'Beto Lima']);
  });

  it('has no answer for a member who has not answered', async () => {
    const { repo, as } = setup();
    await repo.create('c1', input('Piquenique', at(10)));
    as('u2');

    const listed = await repo.listUpcoming('c1', NOW);
    if (!listed.ok) throw new Error('list failed');
    expect(listed.value[0].myRsvp).toBeNull();
  });

  it('refuses a non-member on create and RSVP with unauthorized (MEET-05 AC7)', async () => {
    const { repo, as } = setup((_circle, user) => user === 'u1');
    const created = await repo.create('c1', input('Piquenique', at(10)));
    if (!created.ok) throw new Error('create failed');
    as('u2');

    const create = await repo.create('c1', input('Intruso', at(11)));
    const rsvp = await repo.setRsvp(created.value.id, 'going');

    expect(create).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'unauthorized' }),
    });
    expect(rsvp).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'unauthorized' }),
    });
    expect(await repo.listUpcoming('c1', NOW)).toEqual({ ok: true, value: [] });
  });

  it('refuses everything when signed out', async () => {
    const { repo, as } = setup();
    as(null);

    const create = await repo.create('c1', input('Piquenique', at(10)));

    expect(create.ok).toBe(false);
  });

  it('returns not_found when answering an unknown meetup', async () => {
    const { repo } = setup();

    expect(await repo.setRsvp('nope', 'going')).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'not_found' }),
    });
  });
});
