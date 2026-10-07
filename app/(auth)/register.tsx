import { router } from 'expo-router';

import { RegisterScreen } from '@/modules/auth';

// SPEC_DEVIATION: design.md says router.push between the auth screens.
// Reason: T22 asks to navigate back; dismissTo returns to the sign-in entry
// already in the stack (or opens it on a deep link) instead of stacking a copy.
export default function RegisterRoute() {
  return (
    <RegisterScreen onNavigateToSignIn={() => router.dismissTo('/sign-in')} />
  );
}
