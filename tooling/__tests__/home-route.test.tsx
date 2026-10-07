// Lives outside `app/` on purpose: Expo Router turns every file under `app/` into a route,
// so a test file there would be bundled as a screen.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightColors } from '@/core/theme';

import Index from '../../app/index';

describe('home route', () => {
  it('renders a screen with the background color role', async () => {
    await render(<Index />);

    const style = StyleSheet.flatten(screen.toJSON()?.props.style);
    expect(style.backgroundColor).toBe(lightColors.background);
  });
});
