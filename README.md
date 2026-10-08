# Roda

Aplicativo mobile (Expo + TypeScript + Supabase) do projeto final de Programação Mobile (UEPA). Entrega: 08/10/2026.

## O que é

Roda é uma rede social de círculos pequenos e fechados (no máximo 12 pessoas que já se conhecem) pensada para reduzir o uso compulsivo de redes sociais. A tese é "offline-first social": em vez de combater a dinâmica social, o app a usa para empurrar as pessoas para a vida real, com compromissos coletivos (pactos), um relato curto por dia e reações qualitativas. Há anti-recursos permanentes, que são decisões de produto e não omissões: sem rolagem infinita (o feed é finito e termina em "você chegou ao fim"), sem contadores de curtidas ou métricas de popularidade, sem seguidores nem perfis públicos, sem ranking algorítmico.

## Funcionalidades implementadas

- **Abertura e onboarding:** splash (anel de 12 pontos e "Roda") em toda abertura, enquanto a sessão é restaurada (no mínimo 1,2 s); ela entra com uma animação suave e some em fade sobre a primeira tela. As páginas do onboarding trocam com fade e um leve deslize, e as animações são puladas quando o aparelho pede movimento reduzido. Na primeira abertura sem sessão aparecem três telas de onboarding; "Pular" e "Começar" levam a Criar conta, "Já tenho conta" a Entrar. A marca "já visto" fica no aparelho (AsyncStorage, chave `roda.onboarding.seen`; no web, localStorage), então as próximas aberturas sem sessão vão direto para Entrar e sair da conta não traz o onboarding de volta. Com sessão, o app abre direto em Círculos.
- **Autenticação:** cadastro, entrada e saída com Supabase Auth, rotas protegidas por sessão, tela de perfil.
- **Círculos:** criar círculo, entrar por código de convite, lista de membros; limite de 12 membros garantido no banco (trigger na migration `0002`).
- **Pactos:** CRUD completo (criar, listar, ver, editar, apagar), check-in diário (um por membro por dia) e progresso coletivo do círculo, sem ranking individual.
- **Relatos:** um relato curto por dia (até 280 caracteres), feed cronológico finito e reações qualitativas ("Estou com você", "Me inspirou"); o autor vê quais tipos de reação recebeu, sem saber quem reagiu e sem contagens.
- **Encontros (meetups): NÃO implementados.** Existe apenas a especificação em `.specs/features/meetups/spec.md`; não há módulo em `src/modules/` nem tabelas nas migrations, e a aba Encontros do círculo mostra apenas "Em breve". O botão "preciso de apoio" também está fora do escopo.

## Requisitos da disciplina

| Requisito                             | Onde está                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface mobile, 3+ telas, navegação | Expo Router: telas de entrada, cadastro, círculos, pacto, relatos, perfil etc. (`app/`), abas e pilhas                                            |
| Formulário e validação                | Cadastro/entrada, novo círculo, código de convite, novo pacto, novo relato (react-hook-form + Zod, esquemas na camada `domain`)                   |
| Consumo de API                        | Supabase Auth + PostgREST (`@supabase/supabase-js`), com Row Level Security                                                                       |
| Exibição de dados                     | Lista de círculos, membros, pactos com progresso, feed de relatos                                                                                 |
| CRUD                                  | Pactos: criar, ler, editar e apagar                                                                                                               |
| Tratamento de erros                   | `AppError`/`Result` (`src/core/errors`); erros de infraestrutura são traduzidos na camada `data`; telas com estados de carregamento, vazio e erro |

## Stack

Expo SDK 57, React Native 0.86, Expo Router, TypeScript (strict), Supabase (`@supabase/supabase-js`), react-hook-form + Zod, Jest (`jest-expo`) + React Native Testing Library, ESLint + Prettier. Fontes Fraunces e DM Sans. Roda no Expo Go (sem módulos nativos).

## Arquitetura

Modular por feature, com arquitetura limpa: `presentation -> domain <- data`. O `domain` é TypeScript puro (sem React, Expo ou Supabase). Cada módulo só é importado pelo seu `index.ts` (o ESLint impede imports internos entre módulos).

```
app/                    # rotas do Expo Router (finas, só renderizam telas dos módulos)
src/
  core/                 # theme (papéis de cor), errors (AppError/Result), supabase, di
  shared/               # ui, hooks, date
  modules/
    auth/ circles/ pacts/ stories/ onboarding/
      domain/           # entidades, interfaces de repositório, casos de uso, schemas Zod
      data/             # InMemory*Repository (testes) e Supabase*Repository (produção)
      presentation/     # telas, componentes, hooks
      __tests__/
      index.ts
supabase/migrations/    # SQL das tabelas e das políticas RLS
```

Os repositórios são injetados por um provider de injeção de dependência (`src/core/di`), então os testes usam a versão em memória e o app usa a do Supabase. Toda tabela tem Row Level Security: uma pessoa só lê e escreve dados dos círculos de que participa.

## Como rodar

1. Instale as dependências:

   ```
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (chave publicável do seu projeto Supabase; nunca use a chave secret/service_role). O `.env` não é versionado.
3. No Supabase, abra o SQL Editor e aplique as migrations em ordem:
   1. `supabase/migrations/0001_profiles.sql`
   2. `supabase/migrations/0002_circles_pacts_stories.sql`
   3. `supabase/migrations/0003_pacts_trim_checks.sql`
   4. `supabase/migrations/0004_stories_hardening.sql`

   Mantenha a Data API habilitada (com `public` em Exposed schemas), senão toda chamada REST retorna 503. Em Authentication, deixe "Confirm email" desligado.

4. Inicie o app:

   ```
   npx expo start --web
   ```

   Depois de adicionar rotas novas (como `app/(auth)/onboarding.tsx`), reinicie com `npx expo start --web --clear` (o Metro guarda o mapa de rotas em cache). Para ver o onboarding de novo no web, apague a chave `roda.onboarding.seen` do localStorage do site (ou use uma janela anônima). Para usar o Expo Go, rode `npx expo start` e leia o QR code no aplicativo.

## Como testar

```
npm test            # Jest (domínio, dados e telas)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run format      # Prettier (escreve)
```

O backend Supabase real não é coberto por testes automatizados; foi validado manualmente (web, duas contas).

## Processo (spec-driven)

O projeto segue o fluxo Specify -> Design -> Tasks -> Execute com a skill `tlc-spec-driven`. Tudo fica em `.specs/`: decisões de arquitetura (`STATE.md`), cronograma (`ROADMAP.md`) e, por feature, `spec.md` (requisitos em EARS), `design.md` (ou uma nota de design dentro de `tasks.md`), `tasks.md` e `validation.md` (verificação independente). Testes vêm antes do código e cada tarefa vira um commit Conventional Commit. Contexto do produto em `docs/PROJECT_CONTEXT.md`, identidade visual em `docs/DESIGN_SYSTEM.md` e protótipos em `docs/FIGMA_SCREENS.md`.

## Roteiro de demonstração

Use dois navegadores (ou uma janela anônima) com duas contas.

1. Conta A: cadastre-se e crie um círculo; anote o código de convite na aba Membros.
2. Conta B: cadastre-se, escolha "Entrar com código" e informe o código; B aparece nos membros.
3. Conta A: crie um pacto e abra o detalhe.
4. Contas A e B: faça o check-in; o progresso coletivo sobe (um check-in por dia por pessoa). Mostre também editar e apagar o pacto.
5. Conta A: na aba Relatos, toque em "Escrever relato" e publique o relato do dia; depois disso o feed mostra "Você já compartilhou hoje" (um relato por pessoa por dia, garantido também no banco).
6. Conta B: veja o relato no feed finito (termina em "você chegou ao fim") e reaja com "Estou com você".
7. Conta A: o relato mostra "Recebeu: ..." sem contagens.
