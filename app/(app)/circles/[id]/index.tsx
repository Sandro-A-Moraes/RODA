import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/modules/auth';
import { CircleShell, MembersView } from '@/modules/circles';
import type { CircleTab } from '@/modules/circles';
import { PactsView } from '@/modules/pacts';
import { EmptyState } from '@/shared/ui';

export default function CircleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [tab, setTab] = useState<CircleTab>('pacts');

  const newPact = () =>
    router.push({ pathname: '/circles/[id]/pacts/new', params: { id } });

  return (
    <CircleShell
      circleId={id}
      active={tab}
      onChangeTab={setTab}
      onBack={() => router.back()}
      onAdd={
        tab === 'pacts' ? { label: 'Novo pacto', onPress: newPact } : undefined
      }
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
      {tab === 'stories' || tab === 'meetups' ? (
        <EmptyState
          title="Em breve"
          body="Esta área ainda está em construção."
        />
      ) : null}
    </CircleShell>
  );
}
