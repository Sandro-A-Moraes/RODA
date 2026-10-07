import { registerSchema, signInSchema } from '../domain/auth-schemas';

const validRegister = {
  displayName: 'Ana',
  email: 'ana@mail.com',
  password: '12345678',
};

function registerIssues(input: Record<string, unknown>) {
  const result = registerSchema.safeParse({ ...validRegister, ...input });
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

function signInIssues(input: Record<string, unknown>) {
  const result = signInSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

describe('registerSchema', () => {
  it('rejects an invalid e-mail with "E-mail inválido"', () => {
    expect(registerIssues({ email: 'ana.mail.com' })).toEqual([
      { path: 'email', message: 'E-mail inválido' },
    ]);
  });

  it('rejects a 7-char password with the minimum-length message', () => {
    expect(registerIssues({ password: '1234567' })).toEqual([
      { path: 'password', message: 'A senha deve ter pelo menos 8 caracteres' },
    ]);
  });

  it('accepts an 8-char password', () => {
    expect(registerIssues({ password: '12345678' })).toEqual([]);
  });

  it.each([
    ['1 char', 'A'],
    ['41 chars', 'A'.repeat(41)],
  ])('rejects a name of %s with the length message', (_label, displayName) => {
    expect(registerIssues({ displayName })).toEqual([
      { path: 'displayName', message: 'Nome deve ter entre 2 e 40 caracteres' },
    ]);
  });

  it.each([
    ['2 chars', 'Al'],
    ['40 chars', 'A'.repeat(40)],
  ])('accepts a name of %s', (_label, displayName) => {
    expect(registerIssues({ displayName })).toEqual([]);
  });

  it('treats a whitespace-only name as shorter than 2 characters', () => {
    expect(registerIssues({ displayName: '     ' })).toEqual([
      { path: 'displayName', message: 'Nome deve ter entre 2 e 40 caracteres' },
    ]);
  });

  it('measures the name length after trimming and returns it trimmed', () => {
    expect(registerIssues({ displayName: ' A ' })).toEqual([
      { path: 'displayName', message: 'Nome deve ter entre 2 e 40 caracteres' },
    ]);
    const parsed = registerSchema.parse({
      ...validRegister,
      displayName: '  Ana Lima  ',
    });
    expect(parsed.displayName).toBe('Ana Lima');
  });

  it('trims and lowercases the e-mail', () => {
    const parsed = registerSchema.parse({
      ...validRegister,
      email: '  Ana@Mail.COM ',
    });
    expect(parsed.email).toBe('ana@mail.com');
  });
});

describe('signInSchema', () => {
  it('rejects an empty e-mail with "Campo obrigatório"', () => {
    expect(signInIssues({ email: '', password: 'secret123' })).toEqual([
      { path: 'email', message: 'Campo obrigatório' },
    ]);
  });

  it('rejects an empty password with "Campo obrigatório"', () => {
    expect(signInIssues({ email: 'ana@mail.com', password: '' })).toEqual([
      { path: 'password', message: 'Campo obrigatório' },
    ]);
  });

  it('accepts a 3-char password', () => {
    expect(signInIssues({ email: 'ana@mail.com', password: 'abc' })).toEqual(
      [],
    );
  });

  it('trims and lowercases the e-mail', () => {
    const parsed = signInSchema.parse({
      email: '  Ana@Mail.COM ',
      password: 'abc',
    });
    expect(parsed.email).toBe('ana@mail.com');
  });
});
