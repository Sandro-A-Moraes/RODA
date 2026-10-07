import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';

import { Icon } from './icon';
import type { IconName } from './icon';
import { Text } from './text';

const icons: Record<string, IconName> = { index: 'circles', profile: 'user' };
const labels: Record<string, string> = { index: 'Círculos', profile: 'Perfil' };

// Bottom bar from the Figma TabBar: icon + label, terracotta indicator on top.
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        height: 64 + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.card,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.textPrimary : colors.textSecondary;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={labels[route.name] ?? route.name}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
            }}
          >
            {focused ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 28,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colors.accent,
                }}
              />
            ) : null}
            <Icon name={icons[route.name] ?? 'circles'} color={color} />
            <Text
              type={focused ? 'captionStrong' : 'caption'}
              style={{ color }}
            >
              {labels[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
