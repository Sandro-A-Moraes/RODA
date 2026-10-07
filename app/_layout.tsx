import { Stack } from 'expo-router';

import { DependencyProvider } from '@/core/di';

export default function RootLayout() {
  return (
    <DependencyProvider provisions={[]}>
      <Stack screenOptions={{ headerShown: false }} />
    </DependencyProvider>
  );
}
