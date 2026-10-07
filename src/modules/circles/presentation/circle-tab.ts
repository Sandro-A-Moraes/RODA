export type CircleTab = 'pacts' | 'stories' | 'meetups' | 'members';

const circleTabs: readonly CircleTab[] = [
  'pacts',
  'stories',
  'meetups',
  'members',
];

// Route param -> tab; anything unknown opens the default tab.
export function parseCircleTab(value: string | undefined): CircleTab {
  return circleTabs.find((tab) => tab === value) ?? 'pacts';
}
