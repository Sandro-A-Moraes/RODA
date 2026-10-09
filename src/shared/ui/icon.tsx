import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'back'
  | 'plus'
  | 'check'
  | 'chevron'
  | 'pencil'
  | 'circles'
  | 'user'
  | 'alert'
  | 'eye'
  | 'eye-off'
  | 'pin'
  | 'calendar'
  | 'people';

export interface IconProps {
  name: IconName;
  color: string;
  size?: number;
}

export function Icon({ name, color, size = 24 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' ? <Path d="M15 5l-7 7 7 7" {...stroke} /> : null}
      {name === 'plus' ? <Path d="M12 5v14M5 12h14" {...stroke} /> : null}
      {name === 'check' ? (
        <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
      ) : null}
      {name === 'chevron' ? <Path d="M9 5l7 7-7 7" {...stroke} /> : null}
      {name === 'pencil' ? (
        <Path
          d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1zM14 7l3 3"
          {...stroke}
        />
      ) : null}
      {name === 'circles' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Circle cx="12" cy="12" r="3.5" {...stroke} />
        </>
      ) : null}
      {name === 'alert' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7.5v5.5M12 16.5v.01" {...stroke} />
        </>
      ) : null}
      {name === 'eye' || name === 'eye-off' ? (
        <>
          <Path
            d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"
            {...stroke}
          />
          <Circle cx="12" cy="12" r="3" {...stroke} />
        </>
      ) : null}
      {name === 'eye-off' ? <Path d="M4 4l16 16" {...stroke} /> : null}
      {name === 'pin' ? (
        <>
          <Path
            d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"
            {...stroke}
          />
          <Circle cx="12" cy="10" r="2.2" {...stroke} />
        </>
      ) : null}
      {name === 'calendar' ? (
        <>
          <Path d="M4 6.5h16v13H4zM4 10.5h16M8.5 4v4M15.5 4v4" {...stroke} />
        </>
      ) : null}
      {name === 'people' ? (
        <>
          <Circle cx="9" cy="8.5" r="3.2" {...stroke} />
          <Path d="M3 20c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5" {...stroke} />
          <Path
            d="M16 5.6a3.2 3.2 0 010 5.8M18 14.8c1.8.6 3 2.2 3 5.2"
            {...stroke}
          />
        </>
      ) : null}
      {name === 'user' ? (
        <>
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
