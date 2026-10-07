import * as auth from '@/modules/auth';

// design.md "Public API and routes": the runtime exports of the module index.
// `AuthUser` is a type and has no runtime value.
describe('auth module public API', () => {
  it('exports only the design list', () => {
    expect(Object.keys(auth).sort()).toEqual(
      [
        'HomeScreen',
        'InMemoryAuthRepository',
        'RegisterScreen',
        'RootNavigator',
        'SessionProvider',
        'SignInScreen',
        'SupabaseAuthRepository',
        'authRepositoryToken',
        'useSession',
      ].sort(),
    );
  });
});
