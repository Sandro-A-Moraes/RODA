import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/core/theme';

import { SplashScreen } from '../presentation/splash-screen';

const mockStatusBar = jest.fn();
jest.mock('expo-status-bar', () => ({
  StatusBar: (props: { hidden?: boolean }) => {
    mockStatusBar(props);
    return null;
  },
}));

describe('SplashScreen', () => {
  it('shows the wordmark and the tagline', async () => {
    await render(<SplashScreen />);

    expect(screen.getByText('Roda')).toBeTruthy();
    expect(screen.getByText('Menos tela. Mais roda.')).toBeTruthy();
  });

  it('exposes the accessible label "Roda. Carregando"', async () => {
    await render(<SplashScreen />);

    expect(screen.getByLabelText('Roda. Carregando')).toBeTruthy();
  });

  it('paints the forest background with on-inverse text', async () => {
    await render(<SplashScreen />);

    expect(screen.getByLabelText('Roda. Carregando')).toHaveStyle({
      backgroundColor: lightColors.inverse,
    });
    expect(screen.getByText('Roda')).toHaveStyle({
      color: lightColors.onInverse,
    });
    expect(screen.getByText('Menos tela. Mais roda.')).toHaveStyle({
      color: lightColors.onInverseSecondary,
    });
  });

  it('draws the ring with 12 dots', async () => {
    await render(<SplashScreen />);

    expect(
      screen.getAllByTestId('splash-ring-dot', { includeHiddenElements: true }),
    ).toHaveLength(12);
  });

  it('hides the status bar', async () => {
    await render(<SplashScreen />);

    expect(mockStatusBar).toHaveBeenCalledWith(
      expect.objectContaining({ hidden: true }),
    );
  });
});
