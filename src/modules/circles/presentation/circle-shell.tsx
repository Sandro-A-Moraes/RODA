import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import type { ReactNode } from 'react';

import { useDependency } from '@/core/di';
import { useTheme } from '@/core/theme';
import { useLoad } from '@/shared/hooks/use-load';
import { Header, Screen, SegTabs } from '@/shared/ui';

import { circleRepositoryToken } from '../domain/circle-repository';
import type { CircleTab } from './circle-tab';

const tabs = [
  { key: 'pacts', label: 'Pactos' },
  { key: 'stories', label: 'Relatos' },
  { key: 'meetups', label: 'Encontros' },
  { key: 'members', label: 'Membros' },
] as const satisfies readonly { key: CircleTab; label: string }[];

export interface CircleShellProps {
  circleId: string;
  active: CircleTab;
  onChangeTab: (tab: CircleTab) => void;
  onBack: () => void;
  onAdd?: { label: string; onPress: () => void };
  children: ReactNode;
}

// Back header + top tab strip shared by the four circle screens (Figma 07-10).
export function CircleShell({
  circleId,
  active,
  onChangeTab,
  onBack,
  onAdd,
  children,
}: CircleShellProps) {
  const repo = useDependency(circleRepositoryToken);
  const { spacing } = useTheme();
  const { state } = useLoad(
    useCallback(() => repo.get(circleId), [repo, circleId]),
  );
  const title = state.status === 'ready' ? state.data.name : '';

  return (
    <Screen>
      <Header
        title={title}
        onBack={onBack}
        action={
          onAdd
            ? { icon: 'plus', label: onAdd.label, onPress: onAdd.onPress }
            : undefined
        }
      />
      <SegTabs tabs={tabs} active={active} onChange={onChangeTab} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}
