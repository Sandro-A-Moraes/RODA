import { useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/modules/auth';
import { MeetupDetailScreen } from '@/modules/meetups';

export default function MeetupDetailRoute() {
  const { id, meetupId } = useLocalSearchParams<{
    id: string;
    meetupId: string;
  }>();
  const router = useRouter();
  const { user } = useSession();
  return (
    <MeetupDetailScreen
      circleId={id}
      meetupId={meetupId}
      currentUserId={user?.id ?? ''}
      onBack={() => router.back()}
    />
  );
}
