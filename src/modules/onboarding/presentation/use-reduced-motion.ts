import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// react-native-web has no native animated module; JS-driven there.
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** True when the device asks for reduced motion; false until it is known. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (active) setReduced(value);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, []);

  return reduced;
}
