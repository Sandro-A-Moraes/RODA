import { z } from 'zod';

const requiredMessage = 'Campo obrigatório';
const nameLengthMessage = 'Nome deve ter entre 2 e 40 caracteres';

// Trim and lowercase run before the format check, so "  Ana@Mail.COM " is valid.
const normalizedEmail = z.string().trim().toLowerCase();

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, nameLengthMessage)
    .max(40, nameLengthMessage),
  email: normalizedEmail.pipe(z.email('E-mail inválido')),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export const signInSchema = z.object({
  email: normalizedEmail.min(1, requiredMessage),
  password: z.string().min(1, requiredMessage),
});
