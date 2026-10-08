import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { lightColors } from '@/core/theme';

import { InMemoryOnboardingStore } from '../data/in-memory-onboarding-store';
import { onboardingStoreToken } from '../domain/onboarding-store';
import { OnboardingProvider } from '../presentation/onboarding-provider';
import { OnboardingScreen } from '../presentation/onboarding-screen';

async function renderOnboarding() {
  const store = new InMemoryOnboardingStore();
  const onExit = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(onboardingStoreToken, store)]}>
      <OnboardingProvider>
        <OnboardingScreen onExit={onExit} />
      </OnboardingProvider>
    </DependencyProvider>,
  );
  return { store, onExit };
}

async function press(label: string) {
  await fireEvent.press(screen.getByRole('button', { name: label }));
}

async function goToPage(page: 2 | 3) {
  await press('Continuar');
  if (page === 3) await press('Continuar');
}

function buttonLabels() {
  return screen
    .getAllByRole('button')
    .map((button) => button.props.accessibilityLabel as string);
}

function allButtonLabels() {
  return screen
    .getAllByRole('button', { includeHiddenElements: true })
    .map((button) => button.props.accessibilityLabel as string);
}

describe('OnboardingScreen', () => {
  describe('page 1', () => {
    it('shows the small-circle title, body and ring', async () => {
      await renderOnboarding();

      expect(
        screen.getByText('Um círculo pequeno, de gente que você conhece.'),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'No Roda não há seguidores nem perfil público. São no máximo 12 pessoas próximas.',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText('12', { includeHiddenElements: true }),
      ).toBeTruthy();
      expect(
        screen.getByText('pessoas, no máximo', { includeHiddenElements: true }),
      ).toBeTruthy();
      expect(
        screen.getAllByTestId('onboarding-ring-dot', {
          includeHiddenElements: true,
        }),
      ).toHaveLength(12);
    });

    it('offers exactly "Pular" and "Continuar"', async () => {
      await renderOnboarding();

      expect(buttonLabels()).toEqual(['Pular', 'Continuar']);
    });

    it('exposes the indicator as "Página 1 de 3"', async () => {
      await renderOnboarding();

      expect(screen.getByLabelText('Página 1 de 3')).toBeTruthy();
    });
  });

  describe('page 2', () => {
    it('opens on "Continuar" from page 1 with the pact title, body and progress card', async () => {
      await renderOnboarding();
      await goToPage(2);

      expect(
        screen.getByText('Combinem um pacto e cumpram juntos.'),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'Todo dia cada pessoa faz o check-in. O círculo vê o progresso do grupo, nunca um ranking.',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText('5 de 7', { includeHiddenElements: true }),
      ).toBeTruthy();
      expect(
        screen.getByText('fizeram o check-in hoje', {
          includeHiddenElements: true,
        }),
      ).toBeTruthy();
      expect(
        screen.queryByText('Um círculo pequeno, de gente que você conhece.'),
      ).toBeNull();
      expect(buttonLabels()).toEqual(['Pular', 'Continuar']);
      expect(screen.getByLabelText('Página 2 de 3')).toBeTruthy();
    });
  });

  describe('page 3', () => {
    it('opens on "Continuar" from page 2 with the story title, body, sample card and end marker', async () => {
      await renderOnboarding();
      await goToPage(3);

      expect(
        screen.getByText('Um relato por dia. Depois, o encontro.'),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'Conte o que fez fora da tela, reaja sem curtidas e marque um encontro de verdade.',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText('Beto Lima', { includeHiddenElements: true }),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'Jantar em família sem tela. A conversa rendeu até tarde.',
          { includeHiddenElements: true },
        ),
      ).toBeTruthy();
      expect(
        screen.getByText('você chegou ao fim', { includeHiddenElements: true }),
      ).toBeTruthy();
      expect(screen.getByLabelText('Página 3 de 3')).toBeTruthy();
    });

    it('offers exactly "Começar" and "Já tenho conta", without "Pular"', async () => {
      await renderOnboarding();
      await goToPage(3);

      expect(buttonLabels()).toEqual(['Começar', 'Já tenho conta']);
      expect(screen.queryByText('Pular')).toBeNull();
    });
  });

  describe('page indicator', () => {
    it.each([1, 2, 3] as const)(
      'on page %i shows three dots with only that one as the accent pill',
      async (page) => {
        await renderOnboarding();
        if (page > 1) await goToPage(page as 2 | 3);

        const indicator = screen.getByLabelText(`Página ${page} de 3`);
        const dots = screen.getAllByTestId(/^page-dot-\d$/);
        expect(dots).toHaveLength(3);
        dots.forEach((dot, index) => {
          if (index === page - 1) {
            expect(dot).toHaveStyle({
              width: 28,
              height: 8,
              backgroundColor: lightColors.accent,
            });
          } else {
            expect(dot).toHaveStyle({
              width: 8,
              height: 8,
              backgroundColor: lightColors.decorative,
            });
          }
        });
        expect(indicator).toBeTruthy();
      },
    );
  });

  describe('illustrations', () => {
    it('are hidden from screen readers and offer no interaction', async () => {
      await renderOnboarding();
      expect(screen.queryByText('12')).toBeNull();

      await press('Continuar');
      expect(screen.queryByText('5 de 7')).toBeNull();

      await press('Continuar');
      expect(screen.queryByText('Beto Lima')).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Estou com você' }),
      ).toBeNull();
      expect(screen.queryByRole('button', { name: 'Me inspirou' })).toBeNull();
    });

    it('contain no buttons, even counting hidden elements', async () => {
      await renderOnboarding();
      expect(allButtonLabels()).toEqual(['Pular', 'Continuar']);

      await press('Continuar');
      expect(allButtonLabels()).toEqual(['Pular', 'Continuar']);

      await press('Continuar');
      expect(allButtonLabels()).toEqual(['Começar', 'Já tenho conta']);
    });

    it.each([1, 2, 3] as const)(
      'on page %i ignore touches and clicks',
      async (page) => {
        await renderOnboarding();
        if (page > 1) await goToPage(page as 2 | 3);

        expect(
          screen.getByTestId('onboarding-illustration', {
            includeHiddenElements: true,
          }),
        ).toHaveStyle({ pointerEvents: 'none' });
      },
    );
  });

  describe('system back', () => {
    type BackListener = () => boolean | null | undefined;
    let listeners: BackListener[] = [];

    beforeEach(() => {
      listeners = [];
      jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_event, listener) => {
          listeners.push(listener as BackListener);
          return {
            remove: () => {
              listeners = listeners.filter((l) => l !== listener);
            },
          };
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    // Mirrors the platform: the newest listener runs first; the first that
    // returns true consumes the press, otherwise the default applies.
    async function pressSystemBack() {
      let handled = false;
      await act(async () => {
        for (const listener of [...listeners].reverse()) {
          if (listener()) {
            handled = true;
            break;
          }
        }
      });
      return handled;
    }

    it('on page 3 shows page 2, then page 1', async () => {
      await renderOnboarding();
      await goToPage(3);

      expect(await pressSystemBack()).toBe(true);
      expect(
        screen.getByText('Combinem um pacto e cumpram juntos.'),
      ).toBeTruthy();
      expect(screen.getByLabelText('Página 2 de 3')).toBeTruthy();

      expect(await pressSystemBack()).toBe(true);
      expect(
        screen.getByText('Um círculo pequeno, de gente que você conhece.'),
      ).toBeTruthy();
      expect(screen.getByLabelText('Página 1 de 3')).toBeTruthy();
    });

    it('on page 1 is not handled and stores nothing', async () => {
      const { store, onExit } = await renderOnboarding();

      expect(await pressSystemBack()).toBe(false);
      expect(
        screen.getByText('Um círculo pequeno, de gente que você conhece.'),
      ).toBeTruthy();
      expect(onExit).not.toHaveBeenCalled();
      expect(await store.hasSeen()).toBe(false);
    });
  });

  describe('exits', () => {
    it('"Pular" on page 1 goes to register and stores the flag', async () => {
      const { store, onExit } = await renderOnboarding();

      await press('Pular');
      await act(async () => undefined);

      expect(onExit).toHaveBeenCalledWith('register');
      expect(await store.hasSeen()).toBe(true);
    });

    it('"Pular" on page 2 goes to register and stores the flag', async () => {
      const { store, onExit } = await renderOnboarding();
      await goToPage(2);

      await press('Pular');
      await act(async () => undefined);

      expect(onExit).toHaveBeenCalledWith('register');
      expect(await store.hasSeen()).toBe(true);
    });

    it('"Começar" goes to register and stores the flag', async () => {
      const { store, onExit } = await renderOnboarding();
      await goToPage(3);

      await press('Começar');
      await act(async () => undefined);

      expect(onExit).toHaveBeenCalledWith('register');
      expect(await store.hasSeen()).toBe(true);
    });

    it('"Já tenho conta" goes to sign-in and stores the flag', async () => {
      const { store, onExit } = await renderOnboarding();
      await goToPage(3);

      await press('Já tenho conta');
      await act(async () => undefined);

      expect(onExit).toHaveBeenCalledWith('sign-in');
      expect(await store.hasSeen()).toBe(true);
    });

    it('moving between pages without an exit leaves the flag unset', async () => {
      const { store, onExit } = await renderOnboarding();
      await goToPage(3);

      expect(onExit).not.toHaveBeenCalled();
      expect(await store.hasSeen()).toBe(false);
    });
  });
});
