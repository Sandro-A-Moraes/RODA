import { Text as RNText } from 'react-native';
import type { TextProps, TextStyle } from 'react-native';

import { useTheme } from '@/core/theme';

export type TextType =
  | 'display'
  | 'numeral'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'label';

export interface Props extends TextProps {
  variant?: 'primary' | 'secondary';
  type?: TextType;
}

export function Text({
  variant = 'primary',
  type = 'body',
  style,
  ...rest
}: Props) {
  const { colors, typography } = useTheme();
  const color =
    variant === 'secondary' ? colors.textSecondary : colors.textPrimary;
  const { fonts, sizes } = typography;
  const byType: Record<TextType, TextStyle> = {
    display: {
      fontFamily: fonts.display,
      fontSize: sizes.display,
      lineHeight: 46,
      letterSpacing: -0.4,
    },
    numeral: {
      fontFamily: fonts.display,
      fontSize: sizes.numeral,
      lineHeight: 60,
      letterSpacing: -0.56,
    },
    h1: {
      fontFamily: fonts.display,
      fontSize: sizes.heading,
      lineHeight: 38,
      letterSpacing: -0.16,
    },
    h2: { fontFamily: fonts.display, fontSize: sizes.h2, lineHeight: 30 },
    h3: {
      fontFamily: fonts.display,
      fontSize: sizes.subheading,
      lineHeight: 26,
    },
    bodyLg: { fontFamily: fonts.body, fontSize: sizes.bodyLg, lineHeight: 26 },
    body: { fontFamily: fonts.body, fontSize: sizes.body, lineHeight: 24 },
    bodyStrong: {
      fontFamily: fonts.bodyBold,
      fontSize: sizes.body,
      lineHeight: 24,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: sizes.caption,
      lineHeight: 20,
    },
    captionStrong: {
      fontFamily: fonts.bodyBold,
      fontSize: sizes.caption,
      lineHeight: 20,
    },
    label: {
      fontFamily: fonts.bodyBold,
      fontSize: sizes.label,
      lineHeight: 16,
      letterSpacing: 0.96,
      textTransform: 'uppercase',
    },
  };
  return <RNText style={[{ color }, byType[type], style]} {...rest} />;
}
