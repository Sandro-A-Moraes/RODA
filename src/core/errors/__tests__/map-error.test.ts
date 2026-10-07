import { createAppError, mapError } from '@/core/errors';

const unknownError = createAppError('unknown');
const networkError = createAppError('network');

describe('mapError', () => {
  it('maps TypeError "Network request failed" to network', () => {
    expect(mapError(new TypeError('Network request failed'))).toEqual(
      networkError,
    );
  });

  it('maps TypeError "Failed to fetch" to network', () => {
    expect(mapError(new TypeError('Failed to fetch'))).toEqual(networkError);
  });

  it('maps a TypeError with an unrelated message to unknown', () => {
    expect(mapError(new TypeError('x is not a function'))).toEqual(
      unknownError,
    );
  });

  it('maps a generic Error to unknown', () => {
    expect(mapError(new Error('boom'))).toEqual(unknownError);
  });

  it('maps a string to unknown', () => {
    expect(mapError('boom')).toEqual(unknownError);
  });

  it('maps null to unknown', () => {
    expect(mapError(null)).toEqual(unknownError);
  });

  it('maps undefined to unknown', () => {
    expect(mapError(undefined)).toEqual(unknownError);
  });

  it('maps a plain object to unknown', () => {
    expect(mapError({ foo: 'bar' })).toEqual(unknownError);
  });

  it('passes an existing AppError through unchanged', () => {
    const existing = createAppError('conflict', 'Já existe');
    const mapped = mapError(existing);
    expect(mapped.code).toBe('conflict');
    expect(mapped.message).toBe('Já existe');
  });
});
