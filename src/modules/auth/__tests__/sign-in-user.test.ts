import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { signInUser } from '../domain/sign-in-user';

async function repositoryWithAna() {
  const repo = new InMemoryAuthRepository();
  const signUp = await repo.signUp({
    displayName: 'Ana',
    email: 'ana@mail.com',
    password: '12345678',
  });
  if (!signUp.ok) throw new Error('setup: signUp failed');
  await repo.signOut();
  return { repo, user: signUp.value };
}

describe('signInUser', () => {
  it('returns the user for registered credentials and starts a session', async () => {
    const { repo, user } = await repositoryWithAna();

    const result = await signInUser(repo, {
      email: 'ana@mail.com',
      password: '12345678',
    });

    expect(result).toEqual({ ok: true, value: user });
    expect(await repo.getCurrentUser()).toEqual({ ok: true, value: user });
  });

  it('returns unauthorized for a wrong password', async () => {
    const { repo } = await repositoryWithAna();

    const result = await signInUser(repo, {
      email: 'ana@mail.com',
      password: 'wrong-password',
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'unauthorized', message: 'E-mail ou senha incorretos' },
    });
  });

  it.each([
    ['e-mail', { email: '', password: '12345678' }],
    ['password', { email: 'ana@mail.com', password: '' }],
  ])(
    'returns validation for an empty %s without calling the repository',
    async (_field, input) => {
      const { repo } = await repositoryWithAna();
      const signIn = jest.spyOn(repo, 'signIn');

      const result = await signInUser(repo, input);

      expect(result).toEqual({
        ok: false,
        error: { code: 'validation', message: 'Campo obrigatório' },
      });
      expect(signIn).toHaveBeenCalledTimes(0);
    },
  );

  it('signs in with a padded, uppercased e-mail of an account registered in lowercase', async () => {
    const { repo, user } = await repositoryWithAna();
    const signIn = jest.spyOn(repo, 'signIn');

    const result = await signInUser(repo, {
      email: '  ANA@mail.com ',
      password: '12345678',
    });

    expect(result).toEqual({ ok: true, value: user });
    expect(signIn).toHaveBeenCalledWith({
      email: 'ana@mail.com',
      password: '12345678',
    });
  });
});
