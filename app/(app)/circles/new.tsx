import { useRouter } from 'expo-router';

import { NewCircleScreen } from '@/modules/circles';

export default function NewCircleRoute() {
  const router = useRouter();
  return (
    <NewCircleScreen
      onBack={() => router.back()}
      onCreated={(circle) =>
        router.replace({ pathname: '/circles/[id]', params: { id: circle.id } })
      }
    />
  );
}
