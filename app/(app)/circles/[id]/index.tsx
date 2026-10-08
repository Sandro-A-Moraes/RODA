import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/modules/auth';
import { CircleShell, MembersView, parseCircleTab } from '@/modules/circles';
import type { CircleTab } from '@/modules/circles';
import { PactsView } from '@/modules/pacts';
import { StoriesView } from '@/modules/stories';
import { EmptyState } from '@/shared/ui';

export default function CircleRoute() {
  const { id, tab: initialTab } = useLocalSearchParams<{
    id: string;
    tab?: string;
  }>();
  const router = useRouter();
  const { user } = useSession();
  const [tab, setTab] = useState<CircleTab>(parseCircleTab(initialTab));

  const newPact = () =>
    router.push({ pathname: '/circles/[id]/pacts/new', params: { id } });
  const newStory = () =>
    router.push({ pathname: '/circles/[id]/stories/new', params: { id } });
  const addAction =
    tab === 'pacts'
      ? { label: 'Novo pacto', onPress: newPact }
      : tab === 'stories'
        ? { label: 'Novo relato', onPress: newStory }
        : undefined;

  return (
    <CircleShell
      circleId={id}
      active={tab}
      onChangeTab={setTab}
      onBack={() => router.back()}
      onAdd={addAction}
    >
      {tab === 'pacts' ? (
        <PactsView
          circleId={id}
          onCreate={newPact}
          onOpenPact={(pactId) =>
            router.push({
              pathname: '/circles/[id]/pacts/[pactId]',
              params: { id, pactId },
            })
          }
        />
      ) : null}
      {tab === 'members' ? (
        <MembersView circleId={id} currentUserId={user?.id ?? ''} />
      ) : null}
      {tab === 'stories' ? (
        <StoriesView circleId={id} onWrite={newStory} />
      ) : null}
      {tab === 'meetups' ? (
        <EmptyState
          title="Em breve"
          body="Esta área ainda está em construção."
        />
      ) : null}
    </CircleShell>
  );
}
