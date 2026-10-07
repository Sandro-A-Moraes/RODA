import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightColors } from '@/core/theme';
import { Button } from '@/shared/ui';

describe('Button', () => {
  it('calls onPress exactly once when an enabled button is pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} loading />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress while disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses brand as background and onBrand as label color', async () => {
    await render(<Button label="Entrar" onPress={jest.fn()} />);

    const button = StyleSheet.flatten(screen.getByRole('button').props.style);
    const label = StyleSheet.flatten(screen.getByText('Entrar').props.style);
    expect(button.backgroundColor).toBe(lightColors.brand);
    expect(label.color).toBe(lightColors.onBrand);
  });

  it('has a minimum height of at least 44', async () => {
    await render(<Button label="Entrar" onPress={jest.fn()} />);

    const button = StyleSheet.flatten(screen.getByRole('button').props.style);
    expect(button.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('exposes the button role and the label', async () => {
    await render(<Button label="Entrar" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('reflects disabled in accessibilityState', async () => {
    await render(<Button label="Entrar" onPress={jest.fn()} disabled />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('reflects busy in accessibilityState while loading', async () => {
    await render(<Button label="Entrar" onPress={jest.fn()} loading />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({
      busy: true,
    });
  });
});
