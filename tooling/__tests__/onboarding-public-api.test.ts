import * as onboarding from '@/modules/onboarding';

// tasks.md "Design note": the runtime exports of the module index.
describe('onboarding module public API', () => {
  it('exports only the design list', () => {
    expect(Object.keys(onboarding).sort()).toEqual(
      [
        'AsyncStorageOnboardingStore',
        'InMemoryOnboardingStore',
        'LaunchNavigator',
        'OnboardingProvider',
        'OnboardingScreen',
        'SPLASH_MINIMUM_MS',
        'SplashScreen',
        'onboardingStoreToken',
        'useOnboarding',
      ].sort(),
    );
  });

  it('keeps the splash for 1200 ms by default', () => {
    expect(onboarding.SPLASH_MINIMUM_MS).toBe(1200);
  });
});
