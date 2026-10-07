// Lives outside `app/` on purpose: Expo Router turns every file under `app/` into a route,
// so a test file there would be bundled as a screen.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DependencyProvider, provide } from '@/core/di';
import { lightColors } from '@/core/theme';
import {
  authRepositoryToken,
  InMemoryAuthRepository,
  SessionProvider,
} from '@/modules/auth';

import MainRoute from '../../app/(app)/(tabs)/profile';

async function renderSignedInMainRoute() {
  const repo = new InMemoryAuthRepository();
  await repo.signUp({
    displayName: 'Ana Lima',
    email: 'ana@mail.com',
    password: '12345678',
  });
  await render(
    <DependencyProvider provisions={[provide(authRepositoryToken, repo)]}>
      <SessionProvider>
        <MainRoute />
      </SessionProvider>
    </DependencyProvider>,
  );
}

describe('main area route', () => {
  it('renders a screen with the background color role', async () => {
    await renderSignedInMainRoute();

    const style = StyleSheet.flatten(screen.toJSON()?.props.style);
    expect(style.backgroundColor).toBe(lightColors.background);
  });

  it('shows the signed-in display name', async () => {
    await renderSignedInMainRoute();

    expect(await screen.findByText('Ana Lima')).toBeTruthy();
  });
});
