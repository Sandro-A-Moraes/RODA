import { fireEvent, render, screen } from '@testing-library/react-native';

import { DependencyProvider, provide } from '@/core/di';
import { createAppError, err } from '@/core/errors';

import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import { pactRepositoryToken } from '../domain/pact-repository';
import { PactFormScreen } from '../presentation/pact-form-screen';

const titleMessage = 'Título deve ter entre 3 e 60 caracteres';
const descriptionMessage = 'Descrição deve ter no máximo 280 caracteres';
const offline = 'Sem conexão. Verifique sua internet e tente novamente.';
const notFound = 'Não encontramos o que você procura.';

function newRepo() {
  return new InMemoryPactRepository(
    () => 'u1',
    () => 3,
  );
}

async function renderForm(repo: InMemoryPactRepository, pactId?: string) {
  const onSaved = jest.fn();
  const onBack = jest.fn();
  await render(
    <DependencyProvider provisions={[provide(pactRepositoryToken, repo)]}>
      <PactFormScreen
        circleId="c1"
        pactId={pactId}
        onBack={onBack}
        onSaved={onSaved}
      />
    </DependencyProvider>,
  );
  return { onSaved, onBack };
}

const typeTitle = (value: string) =>
  fireEvent.changeText(screen.getByLabelText('Título'), value);
const typeDescription = (value: string) =>
  fireEvent.changeText(screen.getByLabelText('Descrição (opcional)'), value);
const submit = (label: string) =>
  fireEvent.press(screen.getByRole('button', { name: label }));

describe('PactFormScreen (create)', () => {
  it('creates the pact with trimmed fields and reports it (PACT-01)', async () => {
    const repo = newRepo();
    const create = jest.spyOn(repo, 'create');
    const { onSaved } = await renderForm(repo);

    await typeTitle('  Sem celular  ');
    await typeDescription('  Durante as refeições.  ');
    await submit('Criar pacto');

    await screen.findByLabelText('Título');
    expect(create).toHaveBeenCalledWith('c1', {
      title: 'Sem celular',
      description: 'Durante as refeições.',
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('accepts an empty description (PACT-01)', async () => {
    const repo = newRepo();
    const create = jest.spyOn(repo, 'create');
    const { onSaved } = await renderForm(repo);

    await typeTitle('Sem celular');
    await submit('Criar pacto');

    await screen.findByLabelText('Título');
    expect(create).toHaveBeenCalledWith('c1', {
      title: 'Sem celular',
      description: '',
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it.each(['', ' ab ', 'x'.repeat(61)])(
    'shows the title rule as a field error and does not create for %p (PACT-01)',
    async (title) => {
      const repo = newRepo();
      const create = jest.spyOn(repo, 'create');
      const { onSaved } = await renderForm(repo);

      await typeTitle(title);
      await submit('Criar pacto');

      expect(await screen.findByText(titleMessage)).toBeTruthy();
      expect(create).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    },
  );

  it('shows the description rule as a field error and does not create (PACT-01)', async () => {
    const repo = newRepo();
    const create = jest.spyOn(repo, 'create');
    await renderForm(repo);

    await typeTitle('Sem celular');
    await typeDescription('x'.repeat(281));
    await submit('Criar pacto');

    expect(await screen.findByText(descriptionMessage)).toBeTruthy();
    expect(screen.queryByText(titleMessage)).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps a description of exactly 280 characters valid', async () => {
    const repo = newRepo();
    const create = jest.spyOn(repo, 'create');
    await renderForm(repo);

    await typeTitle('Sem celular');
    await typeDescription('x'.repeat(280));
    await submit('Criar pacto');

    await screen.findByLabelText('Título');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('counts the description characters while typing', async () => {
    await renderForm(newRepo());

    expect(screen.getByText('0 de 280 caracteres')).toBeTruthy();
    await typeDescription('Guardar o celular');

    expect(screen.getByText('17 de 280 caracteres')).toBeTruthy();
  });

  it('shows a repository failure as an alert and stays on the screen', async () => {
    const repo = newRepo();
    jest
      .spyOn(repo, 'create')
      .mockResolvedValue(err(createAppError('network')));
    const { onSaved } = await renderForm(repo);

    await typeTitle('Sem celular');
    await submit('Criar pacto');

    expect(await screen.findByText(offline)).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('goes back from the header', async () => {
    const { onBack } = await renderForm(newRepo());

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('PactFormScreen (edit)', () => {
  async function existing(repo: InMemoryPactRepository) {
    const created = await repo.create('c1', {
      title: 'Sem celular',
      description: 'Durante as refeições.',
    });
    if (!created.ok) throw new Error('setup failed');
    return created.value.id;
  }

  it('prefills the fields and saves the changes (PACT-08)', async () => {
    const repo = newRepo();
    const id = await existing(repo);
    const update = jest.spyOn(repo, 'update');
    const { onSaved } = await renderForm(repo, id);

    expect(await screen.findByDisplayValue('Sem celular')).toBeTruthy();
    expect(screen.getByDisplayValue('Durante as refeições.')).toBeTruthy();
    expect(screen.getByText('Editar pacto')).toBeTruthy();

    await typeTitle('Sem celular à mesa');
    await submit('Salvar pacto');

    await screen.findByLabelText('Título');
    expect(update).toHaveBeenCalledWith(id, {
      title: 'Sem celular à mesa',
      description: 'Durante as refeições.',
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('validates edits like a new pact and does not update (PACT-08)', async () => {
    const repo = newRepo();
    const id = await existing(repo);
    const update = jest.spyOn(repo, 'update');
    await renderForm(repo, id);

    await screen.findByDisplayValue('Sem celular');
    await typeTitle('ab');
    await submit('Salvar pacto');

    expect(await screen.findByText(titleMessage)).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it('shows the load failure with a retry instead of an empty form', async () => {
    const repo = newRepo();
    const id = await existing(repo);
    jest
      .spyOn(repo, 'get')
      .mockResolvedValueOnce(err(createAppError('network')));
    await renderForm(repo, id);

    expect(await screen.findByText(offline)).toBeTruthy();
    expect(screen.queryByLabelText('Título')).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByDisplayValue('Sem celular')).toBeTruthy();
    expect(screen.queryByText(offline)).toBeNull();
  });

  it('shows a not_found message when the pact is gone on load (PACT-09)', async () => {
    await renderForm(newRepo(), 'missing');

    expect(await screen.findByText(notFound)).toBeTruthy();
  });

  it('shows a not_found message when the pact vanishes before saving (PACT-09)', async () => {
    const repo = newRepo();
    const id = await existing(repo);
    await renderForm(repo, id);
    await screen.findByDisplayValue('Sem celular');
    await repo.remove(id);

    await submit('Salvar pacto');

    expect(await screen.findByText(notFound)).toBeTruthy();
  });
});
