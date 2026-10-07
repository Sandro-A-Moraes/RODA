import type { AuthUser } from '../domain/auth-repository';
import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';

const ana = { displayName: 'Ana', email: 'ana@mail.com', password: '12345678' };

async function registeredRepository() {
  const repo = new InMemoryAuthRepository();
  const signUp = await repo.signUp(ana);
  if (!signUp.ok) throw new Error('setup: signUp failed');
  await repo.signOut();
  return { repo, user: signUp.value };
}

describe('InMemoryAuthRepository', () => {
  it('signUp returns the user and starts a session', async () => {
    const repo = new InMemoryAuthRepository();

    const result = await repo.signUp(ana);

    expect(result).toEqual({
      ok: true,
      value: {
        id: expect.any(String),
        email: 'ana@mail.com',
        displayName: 'Ana',
      },
    });
    const current = await repo.getCurrentUser();
    expect(current).toEqual({ ok: true, value: result.ok && result.value });
  });

  it('signUp notifies listeners with the new user', async () => {
    const repo = new InMemoryAuthRepository();
    const listener = jest.fn();
    repo.subscribe(listener);

    const result = await repo.signUp(ana);

    expect(listener).toHaveBeenCalledWith(result.ok && result.value);
  });

  it('signUp with an already registered e-mail returns conflict', async () => {
    const { repo } = await registeredRepository();

    const result = await repo.signUp({ ...ana, displayName: 'Outra Ana' });

    expect(result).toEqual({
      ok: false,
      error: { code: 'conflict', message: 'Este e-mail já está cadastrado' },
    });
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: null });
  });

  it('signIn with the right password returns the user and notifies listeners', async () => {
    const { repo, user } = await registeredRepository();
    const listener = jest.fn();
    repo.subscribe(listener);

    const result = await repo.signIn({
      email: 'ana@mail.com',
      password: '12345678',
    });

    expect(result).toEqual({ ok: true, value: user });
    expect(listener).toHaveBeenCalledWith(user);
  });

  it('signIn with a wrong password returns unauthorized', async () => {
    const { repo } = await registeredRepository();

    const result = await repo.signIn({
      email: 'ana@mail.com',
      password: 'wrong-password',
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'unauthorized', message: 'E-mail ou senha incorretos' },
    });
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: null });
  });

  it('signIn with an unknown e-mail returns the same unauthorized error', async () => {
    const { repo } = await registeredRepository();

    const result = await repo.signIn({
      email: 'bia@mail.com',
      password: '12345678',
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'unauthorized', message: 'E-mail ou senha incorretos' },
    });
  });

  it('signOut clears the session and notifies listeners with null', async () => {
    const repo = new InMemoryAuthRepository();
    await repo.signUp(ana);
    const listener = jest.fn();
    repo.subscribe(listener);

    const result = await repo.signOut();

    expect(result).toEqual({ ok: true, value: undefined });
    expect(listener).toHaveBeenCalledWith(null);
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: null });
  });

  it('getCurrentUser returns the user after sign-in and null after sign-out', async () => {
    const { repo, user } = await registeredRepository();

    await repo.signIn({ email: 'ana@mail.com', password: '12345678' });
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: user });

    await repo.signOut();
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: null });
  });

  it('subscribe returns an unsubscribe that stops notifications', async () => {
    const { repo } = await registeredRepository();
    const calls: (AuthUser | null)[] = [];
    const unsubscribe = repo.subscribe((user) => calls.push(user));

    unsubscribe();
    await repo.signIn({ email: 'ana@mail.com', password: '12345678' });
    await repo.signOut();

    expect(calls).toEqual([]);
  });
});
