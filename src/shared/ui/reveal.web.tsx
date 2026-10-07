import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import type { RevealProps } from './reveal';

// Web entrance driven by GSAP on the underlying DOM node.
export function Reveal({ children, index = 0, style }: RevealProps) {
  const ref = useRef<View>(null);

  useEffect(() => {
    const node = ref.current as unknown as Element | null;
    if (!node) return undefined;
    const tween = gsap.fromTo(
      node,
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        delay: Math.min(index, 8) * 0.07,
        ease: 'power3.out',
        clearProps: 'transform',
      },
    );
    return () => {
      tween.kill();
    };
  }, [index]);

  return (
    <View ref={ref} style={style}>
      {children}
    </View>
  );
}
