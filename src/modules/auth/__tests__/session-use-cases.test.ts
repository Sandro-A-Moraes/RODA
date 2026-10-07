import { createAppError, err } from '@/core/errors';

import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { restoreSession, signOutUser } from '../domain/session-use-cases';

async function signedInRepository() {
  const repo = new InMemoryAuthRepository();
  const signUp = await repo.signUp({
    displayName: 'Ana',
    email: 'ana@mail.com',
    password: '12345678',
  });
  if (!signUp.ok) throw new Error('setup: signUp failed');
  return { repo, user: signUp.value };
}

describe('signOutUser', () => {
  it('ends the session', async () => {
    const { repo } = await signedInRepository();

    const result = await signOutUser(repo);

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: null });
  });
});

describe('restoreSession', () => {
  it('returns the user when a session exists', async () => {
    const { repo, user } = await signedInRepository();

    expect(await restoreSession(repo)).toEqual(user);
  });

  it('returns null when there is no session', async () => {
    const repo = new InMemoryAuthRepository();

    expect(await restoreSession(repo)).toBeNull();
  });

  it('returns null when the repository returns an error (expired or invalid session)', async () => {
    const { repo } = await signedInRepository();
    jest
      .spyOn(repo, 'getCurrentUser')
      .mockResolvedValue(err(createAppError('unauthorized')));

    expect(await restoreSession(repo)).toBeNull();
  });

  it('returns null when the repository rejects', async () => {
    const { repo } = await signedInRepository();
    jest
      .spyOn(repo, 'getCurrentUser')
      .mockRejectedValue(new Error('refresh failed'));

    expect(await restoreSession(repo)).toBeNull();
  });
});
