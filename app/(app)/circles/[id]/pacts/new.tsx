import { useLocalSearchParams, useRouter } from 'expo-router';

import { PactFormScreen } from '@/modules/pacts';

export default function NewPactRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <PactFormScreen
      circleId={id}
      onBack={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
