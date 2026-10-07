import { useRouter } from 'expo-router';

import { useSession } from '@/modules/auth';
import { CirclesListScreen } from '@/modules/circles';

export default function CirclesRoute() {
  const router = useRouter();
  const { user } = useSession();
  return (
    <CirclesListScreen
      userName={user?.displayName ?? ''}
      onOpen={(circle) =>
        router.push({ pathname: '/circles/[id]', params: { id: circle.id } })
      }
      onCreate={() => router.push('/circles/new')}
      onJoin={() => router.push('/circles/join')}
    />
  );
}
