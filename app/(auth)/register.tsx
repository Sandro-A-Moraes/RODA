import { router } from 'expo-router';

import { RegisterScreen } from '@/modules/auth';

// dismissTo returns to the sign-in entry already in the stack (or opens it on a
// deep link) instead of stacking a second copy, which router.push would do.
export default function RegisterRoute() {
  return (
    <RegisterScreen onNavigateToSignIn={() => router.dismissTo('/sign-in')} />
  );
}
