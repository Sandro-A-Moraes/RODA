import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/core/theme';

export interface RingProps {
  size?: number;
  /** Members shown as filled dots, out of 12. */
  filled?: number;
  /** Colors the first dot with the accent, like the auth motif. */
  accentFirst?: boolean;
  /** Unfilled dots use the sage tone instead of the track tone. */
  sage?: boolean;
  /** Filled dot color: brand (default), accent, or sage-on-dark for inverse cards. */
  tone?: 'brand' | 'accent' | 'inverse';
}

const DOTS = 12;

export function Ring({
  size = 64,
  filled = DOTS,
  accentFirst = false,
  sage = false,
  tone = 'brand',
}: RingProps) {
  const { colors } = useTheme();
  const c = size / 2;
  const orbit = size * 0.38;
  const dot = size * 0.045;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: DOTS }, (_, i) => {
        const angle = (i / DOTS) * Math.PI * 2 - Math.PI / 2;
        const on = i < filled;
        const filledFill = {
          brand: colors.brand,
          accent: colors.accent,
          inverse: colors.decorative,
        }[tone];
        const emptyFill =
          tone === 'inverse'
            ? colors.inverseTrack
            : sage
              ? colors.decorative
              : colors.track;
        const fill =
          accentFirst && i === 0 ? colors.accent : on ? filledFill : emptyFill;
        return (
          <Circle
            key={i}
            cx={c + orbit * Math.cos(angle)}
            cy={c + orbit * Math.sin(angle)}
            r={dot * (on ? 1.15 : 1)}
            fill={fill}
          />
        );
      })}
    </Svg>
  );
}
