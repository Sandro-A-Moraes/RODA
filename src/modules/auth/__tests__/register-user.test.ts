import { InMemoryAuthRepository } from '../data/in-memory-auth-repository';
import { registerUser } from '../domain/register-user';

const valid = {
  displayName: 'Ana',
  email: 'ana@mail.com',
  password: '12345678',
};

describe('registerUser', () => {
  it('returns the created user for valid input and starts a session', async () => {
    const repo = new InMemoryAuthRepository();

    const result = await registerUser(repo, valid);

    expect(result).toEqual({
      ok: true,
      value: {
        id: expect.any(String),
        email: 'ana@mail.com',
        displayName: 'Ana',
      },
    });
    expect(await repo.getCurrentUser()).toEqual({
      ok: true,
      value: result.ok && result.value,
    });
  });

  it('sends a trimmed name and a trimmed, lowercased e-mail to the repository', async () => {
    const repo = new InMemoryAuthRepository();
    const signUp = jest.spyOn(repo, 'signUp');

    await registerUser(repo, {
      displayName: '  Ana Lima  ',
      email: '  Ana@Mail.COM ',
      password: '12345678',
    });

    expect(signUp).toHaveBeenCalledTimes(1);
    expect(signUp).toHaveBeenCalledWith({
      displayName: 'Ana Lima',
      email: 'ana@mail.com',
      password: '12345678',
    });
  });

  it.each([
    ['e-mail', { email: 'ana.mail.com' }, 'E-mail inválido'],
    [
      'password',
      { password: '1234567' },
      'A senha deve ter pelo menos 8 caracteres',
    ],
    [
      'display name',
      { displayName: 'A' },
      'Nome deve ter entre 2 e 40 caracteres',
    ],
  ])(
    'returns validation for an invalid %s without calling the repository',
    async (_field, override, message) => {
      const repo = new InMemoryAuthRepository();
      const signUp = jest.spyOn(repo, 'signUp');

      const result = await registerUser(repo, { ...valid, ...override });

      expect(result).toEqual({
        ok: false,
        error: { code: 'validation', message },
      });
      expect(signUp).toHaveBeenCalledTimes(0);
    },
  );

  it('returns the conflict error unchanged for a duplicate e-mail', async () => {
    const repo = new InMemoryAuthRepository();
    await registerUser(repo, valid);
    await repo.signOut();

    const result = await registerUser(repo, {
      ...valid,
      email: ' ANA@mail.com',
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'conflict', message: 'Este e-mail já está cadastrado' },
    });
  });
});
