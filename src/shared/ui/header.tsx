import { Pressable, View } from 'react-native';

import { radius, useTheme } from '@/core/theme';

import { Icon } from './icon';
import type { IconName } from './icon';
import { Text } from './text';

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  action?: {
    icon: Extract<IconName, 'plus' | 'pencil'>;
    label: string;
    onPress: () => void;
  };
}

export function Header({ title, onBack, action }: HeaderProps) {
  const { colors, spacing } = useTheme();
  const root = !onBack;
  return (
    <View
      style={{
        minHeight: root ? 72 : 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onBack}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="back" color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <Text
        accessibilityRole="header"
        type={root ? 'h1' : 'h3'}
        style={{ flex: 1 }}
      >
        {title}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.full,
            backgroundColor:
              action.icon === 'plus' ? colors.brand : 'transparent',
          }}
        >
          <Icon
            name={action.icon}
            size={22}
            color={action.icon === 'plus' ? colors.onBrand : colors.textPrimary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
