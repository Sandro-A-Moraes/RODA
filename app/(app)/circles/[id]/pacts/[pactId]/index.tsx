import { useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/modules/auth';
import { PactDetailScreen } from '@/modules/pacts';

export default function PactRoute() {
  const { id, pactId } = useLocalSearchParams<{ id: string; pactId: string }>();
  const router = useRouter();
  const { user } = useSession();
  return (
    <PactDetailScreen
      pactId={pactId}
      currentUserId={user?.id ?? ''}
      onBack={() => router.back()}
      onEdit={() =>
        router.push({
          pathname: '/circles/[id]/pacts/[pactId]/edit',
          params: { id, pactId },
        })
      }
    />
  );
}
