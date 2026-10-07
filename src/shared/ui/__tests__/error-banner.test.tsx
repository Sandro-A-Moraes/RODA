import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { createAppError } from '@/core/errors';
import { lightColors } from '@/core/theme';
import { ErrorBanner } from '@/shared/ui';

describe('ErrorBanner', () => {
  it('shows the message of the given AppError', async () => {
    const error = createAppError('network');
    await render(<ErrorBanner error={error} />);

    expect(screen.getByText(error.message)).toBeTruthy();
  });

  it('renders nothing for null', async () => {
    await render(<ErrorBanner error={null} />);

    expect(screen.toJSON()).toBeNull();
  });

  it('renders nothing for undefined', async () => {
    await render(<ErrorBanner error={undefined} />);

    expect(screen.toJSON()).toBeNull();
  });

  it('shows "Tentar novamente" and calls onRetry once when pressed', async () => {
    const onRetry = jest.fn();
    await render(
      <ErrorBanner error={createAppError('network')} onRetry={onRetry} />,
    );

    await fireEvent.press(screen.getByText('Tentar novamente'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders no retry button without onRetry', async () => {
    await render(<ErrorBanner error={createAppError('network')} />);

    expect(screen.queryByText('Tentar novamente')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses accent as background', async () => {
    await render(<ErrorBanner error={createAppError('unknown')} />);

    const style = StyleSheet.flatten(screen.toJSON()?.props.style);
    expect(style.backgroundColor).toBe(lightColors.accent);
  });

  it('uses onAccent as message text color', async () => {
    const error = createAppError('unknown');
    await render(<ErrorBanner error={error} />);

    const style = StyleSheet.flatten(
      screen.getByText(error.message).props.style,
    );
    expect(style.color).toBe(lightColors.onAccent);
  });
});
