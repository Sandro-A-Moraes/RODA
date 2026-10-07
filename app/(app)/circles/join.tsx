import { useRouter } from 'expo-router';

import { JoinCircleScreen } from '@/modules/circles';

export default function JoinCircleRoute() {
  const router = useRouter();
  return (
    <JoinCircleScreen
      onBack={() => router.back()}
      onJoined={(circle) =>
        router.replace({ pathname: '/circles/[id]', params: { id: circle.id } })
      }
    />
  );
}
