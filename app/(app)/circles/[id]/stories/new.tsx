import { useLocalSearchParams, useRouter } from 'expo-router';

import { StoryComposerScreen } from '@/modules/stories';

export default function NewStoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <StoryComposerScreen
      circleId={id}
      onBack={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
