import { mapAuthUser } from '../data/map-auth-user';

describe('mapAuthUser', () => {
  it('uses display_name from metadata as the display name', () => {
    expect(
      mapAuthUser({
        id: 'u1',
        email: 'ana.lima@mail.com',
        user_metadata: { display_name: 'Ana Lima' },
      }),
    ).toEqual({
      id: 'u1',
      email: 'ana.lima@mail.com',
      displayName: 'Ana Lima',
    });
  });

  it('falls back to the part of the e-mail before @ without metadata', () => {
    expect(
      mapAuthUser({ id: 'u1', email: 'ana.lima@mail.com', user_metadata: {} }),
    ).toEqual({
      id: 'u1',
      email: 'ana.lima@mail.com',
      displayName: 'ana.lima',
    });
    expect(mapAuthUser({ id: 'u2', email: 'bia@mail.com' })).toEqual({
      id: 'u2',
      email: 'bia@mail.com',
      displayName: 'bia',
    });
  });

  it('gives empty strings for a missing e-mail instead of throwing', () => {
    expect(mapAuthUser({ id: 'u1' })).toEqual({
      id: 'u1',
      email: '',
      displayName: '',
    });
  });
});
