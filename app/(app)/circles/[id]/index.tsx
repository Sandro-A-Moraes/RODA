import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/modules/auth';
import { CircleShell, MembersView, parseCircleTab } from '@/modules/circles';
import type { CircleTab } from '@/modules/circles';
import { MeetupsView } from '@/modules/meetups';
import { PactsView } from '@/modules/pacts';
import { StoriesView } from '@/modules/stories';

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
  const newMeetup = () =>
    router.push({ pathname: '/circles/[id]/meetups/new', params: { id } });
  // Pacts and meetups have a header action (Figma 07, 18); stories writes from the feed (17, 19).
  const addAction =
    tab === 'pacts'
      ? { label: 'Novo pacto', onPress: newPact }
      : tab === 'meetups'
        ? { label: 'Propor encontro', onPress: newMeetup }
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
        <MeetupsView
          circleId={id}
          currentUserId={user?.id ?? ''}
          onPropose={newMeetup}
          onOpen={(meetupId) =>
            router.push({
              pathname: '/circles/[id]/meetups/[meetupId]',
              params: { id, meetupId },
            })
          }
        />
      ) : null}
    </CircleShell>
  );
}
