import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightColors } from '@/core/theme';
import { Text } from '@/shared/ui';

describe('Text', () => {
  it('uses textPrimary by default', async () => {
    await render(<Text>Olá</Text>);

    const style = StyleSheet.flatten(screen.getByText('Olá').props.style);
    expect(style.color).toBe(lightColors.textPrimary);
  });

  it('uses textSecondary for the secondary variant', async () => {
    await render(<Text variant="secondary">Olá</Text>);

    const style = StyleSheet.flatten(screen.getByText('Olá').props.style);
    expect(style.color).toBe(lightColors.textSecondary);
  });

  it('passes extra TextProps through', async () => {
    await render(<Text accessibilityLabel="saudação">Olá</Text>);

    expect(screen.getByLabelText('saudação')).toBeTruthy();
  });
});
