import { router } from 'expo-router';

import { OnboardingScreen } from '@/modules/onboarding';

// replace: onboarding never stays behind the destination in the stack.
export default function OnboardingRoute() {
  return (
    <OnboardingScreen
      onExit={(destination) =>
        router.replace(destination === 'register' ? '/register' : '/sign-in')
      }
    />
  );
}
