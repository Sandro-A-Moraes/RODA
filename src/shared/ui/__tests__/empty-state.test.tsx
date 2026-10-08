import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightColors, spacing, typography } from '@/core/theme';
import { EmptyState } from '@/shared/ui';

const TITLE = 'Nenhum pacto ainda';
const BODY = 'Combinem algo que o círculo todo consiga cumprir, todo dia.';

// Figma component EmptyState (3:120): ring 140, gap 16, vertical padding 32,
// h2 title in textPrimary and body in textSecondary, both centered.
describe('EmptyState', () => {
  it('lays out like the Figma component', async () => {
    await render(<EmptyState title={TITLE} body={BODY} />);

    const root = screen.getByTestId('empty-state');
    const container = StyleSheet.flatten(root.props.style);
    expect(container.gap).toBe(spacing.md);
    expect(container.paddingVertical).toBe(spacing.xl);
    expect(container.paddingHorizontal ?? 0).toBe(0);
    expect(container.padding).toBeUndefined();
    expect(container.alignItems).toBe('center');

    // The first child is the ring's svg host view.
    const ring = root.children[0];
    if (typeof ring === 'string') throw new Error('ring missing');
    expect(ring.props.width).toBe(140);
    expect(ring.props.height).toBe(140);
  });

  it('shows the title as a centered primary h2', async () => {
    await render(<EmptyState title={TITLE} body={BODY} />);

    const title = StyleSheet.flatten(screen.getByText(TITLE).props.style);
    expect(title.fontSize).toBe(typography.sizes.h2);
    expect(title.lineHeight).toBe(30);
    expect(title.fontFamily).toBe(typography.fonts.display);
    expect(title.textAlign).toBe('center');
    expect(title.color).toBe(lightColors.textPrimary);
  });

  it('shows the body as centered secondary body text', async () => {
    await render(<EmptyState title={TITLE} body={BODY} />);

    const body = StyleSheet.flatten(screen.getByText(BODY).props.style);
    expect(body.fontSize).toBe(typography.sizes.body);
    expect(body.lineHeight).toBe(24);
    expect(body.textAlign).toBe('center');
    expect(body.color).toBe(lightColors.textSecondary);
  });
});
