import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { minTouchTarget } from '@/core/theme';
import { TextField } from '@/shared/ui';

describe('TextField', () => {
  it('calls onChangeText with the typed text', async () => {
    const onChangeText = jest.fn();
    await render(
      <TextField label="E-mail" value="" onChangeText={onChangeText} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('E-mail'), 'a');

    expect(onChangeText).toHaveBeenCalledWith('a');
  });

  it('shows the error on screen and exposes it as accessibility hint', async () => {
    await render(
      <TextField
        label="E-mail"
        value=""
        onChangeText={jest.fn()}
        error="E-mail inválido"
      />,
    );

    expect(screen.getByText('E-mail inválido')).toBeTruthy();
    expect(screen.getByLabelText('E-mail').props.accessibilityHint).toBe(
      'E-mail inválido',
    );
  });

  it('renders the error below the input', async () => {
    await render(
      <TextField
        label="E-mail"
        value=""
        onChangeText={jest.fn()}
        error="E-mail inválido"
      />,
    );

    const root = screen.toJSON() as unknown as {
      children: { type: string; children: string[] }[];
    };
    const types = root.children.map((child) => child.type);
    const last = root.children[root.children.length - 1];
    expect(types.indexOf('TextInput')).toBeGreaterThanOrEqual(0);
    expect(types.indexOf('TextInput')).toBeLessThan(root.children.length - 1);
    expect(last.children).toEqual(['E-mail inválido']);
  });

  it('renders no error text without error', async () => {
    await render(
      <TextField label="E-mail" value="" onChangeText={jest.fn()} />,
    );

    expect(screen.queryByText('E-mail inválido')).toBeNull();
    expect(screen.getByLabelText('E-mail').props.accessibilityHint).toBe(
      undefined,
    );
  });

  it('has a minimum height of at least 44', async () => {
    await render(
      <TextField label="E-mail" value="" onChangeText={jest.fn()} />,
    );

    const style = StyleSheet.flatten(
      screen.getByLabelText('E-mail').props.style,
    );
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBe(minTouchTarget);
  });

  it('labels the input with the label text', async () => {
    await render(
      <TextField label="E-mail" value="" onChangeText={jest.fn()} />,
    );

    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByText('E-mail')).toBeTruthy();
  });

  it('passes extra TextInputProps through', async () => {
    await render(
      <TextField
        label="E-mail"
        value=""
        onChangeText={jest.fn()}
        placeholder="voce@exemplo.com"
      />,
    );

    expect(screen.getByPlaceholderText('voce@exemplo.com')).toBeTruthy();
  });
});
