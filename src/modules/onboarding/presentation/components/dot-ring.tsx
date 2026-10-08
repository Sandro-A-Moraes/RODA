import Svg, { Circle } from 'react-native-svg';

export interface DotRingProps {
  /** Box size; the dots sit on the inner edge of the box. */
  size: number;
  dotRadius: number;
  /** One fill per dot, clockwise from the top. */
  fills: readonly string[];
  testID?: string;
}

// The 12-dot motif with per-dot colors, as drawn on Figma 21 and 22.
export function DotRing({ size, dotRadius, fills, testID }: DotRingProps) {
  const center = size / 2;
  const orbit = center - dotRadius;
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {fills.map((fill, i) => {
        const angle = (i / fills.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <Circle
            key={i}
            testID={testID ? `${testID}-dot` : undefined}
            cx={center + orbit * Math.cos(angle)}
            cy={center + orbit * Math.sin(angle)}
            r={dotRadius}
            fill={fill}
          />
        );
      })}
    </Svg>
  );
}
