import { useLocalSearchParams, useRouter } from 'expo-router';

import { MeetupFormScreen } from '@/modules/meetups';

export default function NewMeetupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <MeetupFormScreen
      circleId={id}
      onBack={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
