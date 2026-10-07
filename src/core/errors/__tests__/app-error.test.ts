import { createAppError } from '@/core/errors';
import type { ErrorCode } from '@/core/errors';

const codes: ErrorCode[] = [
  'network',
  'validation',
  'unauthorized',
  'not_found',
  'conflict',
  'unknown',
];

describe('createAppError', () => {
  it.each(codes)('gives code %s a non-empty default message', (code) => {
    const error = createAppError(code);
    expect(error.code).toBe(code);
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('uses the exact default messages for unknown and network', () => {
    expect(createAppError('unknown').message).toBe(
      'Algo deu errado. Tente novamente.',
    );
    expect(createAppError('network').message).toBe(
      'Sem conexão. Verifique sua internet e tente novamente.',
    );
  });

  it('lets a custom message override the default', () => {
    expect(createAppError('validation', 'E-mail inválido')).toEqual({
      code: 'validation',
      message: 'E-mail inválido',
    });
  });
});
