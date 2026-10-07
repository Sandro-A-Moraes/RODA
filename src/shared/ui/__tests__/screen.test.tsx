import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { lightColors } from '@/core/theme';
import { Screen } from '@/shared/ui';

describe('Screen', () => {
  it('renders its children', async () => {
    await render(
      <Screen>
        <RNText>conteúdo</RNText>
      </Screen>,
    );

    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('uses the background color role', async () => {
    await render(<Screen>{null}</Screen>);

    const style = StyleSheet.flatten(screen.toJSON()?.props.style);
    expect(style.backgroundColor).toBe(lightColors.background);
  });
});
