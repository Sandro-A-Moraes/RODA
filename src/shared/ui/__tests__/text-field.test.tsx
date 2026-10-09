import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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
      children: { type: string; children: unknown[] }[];
    };
    const inputIndex = root.children.findIndex((child) =>
      JSON.stringify(child).includes('"type":"TextInput"'),
    );
    const last = root.children[root.children.length - 1];
    expect(inputIndex).toBeGreaterThanOrEqual(0);
    expect(inputIndex).toBeLessThan(root.children.length - 1);
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

  describe('secureTextEntry', () => {
    it('hides the text and offers "Mostrar senha"', async () => {
      await render(
        <TextField
          label="Senha"
          value="segredo1"
          onChangeText={jest.fn()}
          secureTextEntry
        />,
      );

      expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
      expect(screen.getByLabelText('Mostrar senha')).toBeTruthy();
    });

    it('reveals the text on press and offers "Ocultar senha"', async () => {
      await render(
        <TextField
          label="Senha"
          value="segredo1"
          onChangeText={jest.fn()}
          secureTextEntry
        />,
      );

      const user = userEvent.setup();
      await user.press(screen.getByLabelText('Mostrar senha'));

      expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
      expect(screen.getByLabelText('Ocultar senha')).toBeTruthy();
    });

    it('hides the text again on a second press', async () => {
      await render(
        <TextField
          label="Senha"
          value="segredo1"
          onChangeText={jest.fn()}
          secureTextEntry
        />,
      );

      const user = userEvent.setup();
      await user.press(screen.getByLabelText('Mostrar senha'));
      await user.press(screen.getByLabelText('Ocultar senha'));

      expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(true);
    });

    it('renders no toggle for a plain field', async () => {
      await render(
        <TextField label="E-mail" value="" onChangeText={jest.fn()} />,
      );

      expect(screen.queryByLabelText('Mostrar senha')).toBeNull();
    });
  });
});
