import { minTouchTarget, spacing, typography } from '@/core/theme/tokens';

describe('tokens', () => {
  it('minTouchTarget is 44', () => {
    expect(minTouchTarget).toBe(44);
  });

  it('spacing values are strictly increasing multiples of 4', () => {
    const values = Object.values(spacing);
    expect(values.length).toBeGreaterThan(0);
    values.forEach((value, index) => {
      expect(value % 4).toBe(0);
      if (index > 0) expect(value).toBeGreaterThan(values[index - 1]);
    });
  });

  it('typography has a body size of at least 16 and a larger heading', () => {
    expect(typography.sizes.body).toBeGreaterThanOrEqual(16);
    expect(typography.sizes.heading).toBeGreaterThan(typography.sizes.body);
  });
});
