import { router } from 'expo-router';

import { SignInScreen } from '@/modules/auth';

export default function SignInRoute() {
  return <SignInScreen onNavigateToRegister={() => router.push('/register')} />;
}
