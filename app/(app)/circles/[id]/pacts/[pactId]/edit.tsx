import { useLocalSearchParams, useRouter } from 'expo-router';

import { PactFormScreen } from '@/modules/pacts';

export default function EditPactRoute() {
  const { id, pactId } = useLocalSearchParams<{ id: string; pactId: string }>();
  const router = useRouter();
  return (
    <PactFormScreen
      circleId={id}
      pactId={pactId}
      onBack={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
