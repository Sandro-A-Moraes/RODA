import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { InviteCodeActions } from '../presentation/invite-code-actions';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const setString = jest.mocked(Clipboard.setStringAsync);

async function renderActions() {
  await render(<InviteCodeActions circleName="Família" inviteCode="K7M2QX" />);
}

afterEach(() => {
  jest.restoreAllMocks();
  setString.mockReset();
});

describe('InviteCodeActions (CIR-01 share the invite code)', () => {
  it('copies only the code and confirms', async () => {
    setString.mockResolvedValue(true);
    await renderActions();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Copiar código' }),
    );

    expect(setString).toHaveBeenCalledWith('K7M2QX');
    expect(await screen.findByText('Código copiado')).toBeTruthy();
  });

  it('shares a message that names the circle and carries the code', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
    await renderActions();

    await fireEvent.press(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(share).toHaveBeenCalledTimes(1);
    const message = share.mock.calls[0][0].message ?? '';
    expect(message).toContain('Família');
    expect(message).toContain('K7M2QX');
  });

  it('tells the user when copying fails', async () => {
    setString.mockRejectedValue(new Error('denied'));
    await renderActions();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Copiar código' }),
    );

    expect(
      await screen.findByText('Não foi possível copiar. Anote o código.'),
    ).toBeTruthy();
    expect(screen.queryByText('Código copiado')).toBeNull();
  });

  it('tells the user when sharing fails', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('unsupported'));
    await renderActions();

    await fireEvent.press(screen.getByRole('button', { name: 'Compartilhar' }));

    expect(
      await screen.findByText('Não foi possível compartilhar. Copie o código.'),
    ).toBeTruthy();
  });
});
