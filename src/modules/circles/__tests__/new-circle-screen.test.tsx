import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import { circleRepositoryToken } from '../domain/circle-repository';
import { NewCircleScreen } from '../presentation/new-circle-screen';

const nameMessage = 'Nome deve ter entre 2 e 40 caracteres';

async function renderScreen(
  repo = new InMemoryCircleRepository(() => ({ id: 'u1', displayName: 'Ana' })),
) {
  const onCreated = jest.fn();
  const onBack = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(circleRepositoryToken, repo)]}>
      <NewCircleScreen onBack={onBack} onCreated={onCreated} />
    </DependencyProvider>,
  );
  return { repo, onCreated, onBack };
}

const submit = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Criar círculo' }));
const typeName = (value: string) =>
  fireEvent.changeText(screen.getByLabelText('Nome do círculo'), value);

describe('NewCircleScreen', () => {
  it('creates the circle with the trimmed name and reports it (CIR-01)', async () => {
    const { repo, onCreated } = await renderScreen();
    const create = jest.spyOn(repo, 'create');

    await typeName('  Família  ');
    await submit();

    await screen.findByLabelText('Nome do círculo');
    expect(create).toHaveBeenCalledWith('Família');
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onCreated.mock.calls[0][0]).toMatchObject({
      name: 'Família',
      memberCount: 1,
    });
    expect(onCreated.mock.calls[0][0].inviteCode).toMatch(
      /^[A-HJKMNP-Z2-9]{6}$/,
    );
  });

  it.each(['', ' a ', 'x'.repeat(41)])(
    'shows the name rule and does not create for %p (CIR-01)',
    async (name) => {
      const { repo, onCreated } = await renderScreen();
      const create = jest.spyOn(repo, 'create');

      await typeName(name);
      await submit();

      expect(await screen.findByText(nameMessage)).toBeTruthy();
      expect(create).not.toHaveBeenCalled();
      expect(onCreated).not.toHaveBeenCalled();
    },
  );

  it('shows a repository failure as an alert and stays on the screen', async () => {
    const repo = new InMemoryCircleRepository(() => null);
    jest
      .spyOn(repo, 'create')
      .mockResolvedValue(err(createAppError('network')));
    const { onCreated } = await renderScreen(repo);

    await typeName('Família');
    await submit();

    expect(
      await screen.findByText(
        'Sem conexão. Verifique sua internet e tente novamente.',
      ),
    ).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('creates only one circle while the first request is pending', async () => {
    const { repo } = await renderScreen();
    let release: () => void = () => undefined;
    const create = jest.spyOn(repo, 'create').mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(err(createAppError('network')));
        }),
    );

    await typeName('Família');
    await submit();
    await submit();
    release();

    await screen.findByText(
      'Sem conexão. Verifique sua internet e tente novamente.',
    );
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('goes back from the header', async () => {
    const { onBack } = await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
