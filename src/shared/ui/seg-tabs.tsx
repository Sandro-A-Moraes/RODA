import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { Text } from './text';

export interface SegTabsProps<K extends string> {
  tabs: readonly { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
}

export function SegTabs<K extends string>({
  tabs,
  active,
  onChange,
}: SegTabsProps<K>) {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ height: 48, flexDirection: 'row', paddingHorizontal: spacing.md }}
    >
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: spacing.sm,
            }}
          >
            <Text
              type="captionStrong"
              variant={selected ? 'primary' : 'secondary'}
            >
              {tab.label}
            </Text>
            <View
              style={{
                height: 3,
                alignSelf: 'stretch',
                borderRadius: 2,
                backgroundColor: selected ? colors.accent : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
