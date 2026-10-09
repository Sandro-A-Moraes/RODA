# Roda — Roadmap (Spec-Driven)

Este roadmap substitui `docs/PLANO.md` como plano de trabalho. O `PLANO.md` fica como referência histórica (gerado em outra LLM). Fonte de verdade: `.specs/features/*/spec.md`. Decisões de projeto: `.specs/STATE.md`. Contexto do produto: `docs/PROJECT_CONTEXT.md`.

Entrega: **08/10/2026**, adiada para **09/10/2026**. Todas as features, incluindo `meetups`, estão implementadas; restam a checagem manual e a demo.

## Ciclo por feature (TLC Spec-Driven)

```
SPECIFY ✅ → DESIGN? → TASKS? → EXECUTE → VERIFY (automático)
```

Em cada feature: tarefas atômicas, testes derivados dos critérios de aceite (EARS) antes do código, gate verde (`npm test`, `npm run typecheck`, `npm run lint`), **um commit por tarefa** (Conventional Commits, validado por `check_commit.py`), e Verifier independente ao final gerando `validation.md`.

## Dimensionamento por feature

| Ordem | Feature | Prioridade | Reqs | Escopo | Design | Tasks | Observação |
|---|---|---|---|---|---|---|---|
| 1 | `foundation` | P1 | FND-01..09 | Large | `design.md` curto | `tasks.md` formal | Tooling, lint de fronteiras, core, UI base |
| 2 | `auth` | P1 | AUTH-01..08 | Large | `design.md` | `tasks.md` formal | Cria o cliente Supabase e o `.env` |
| 3 | `circles` | P1 | CIR-01..08 | Medium | inline | implícitas | Migration SQL com cap de 12 e RLS |
| 4 | `pacts` | P1 | PACT-01..09 | Large | `design.md` | `tasks.md` formal | CRUD principal da disciplina |
| 5 | `stories` | P1/P2 | STORY-01..07 | Medium | inline | implícitas | Reações (P2) só após o feed |
| 6 | `meetups` | P2 | MEET-01..05 | Medium | inline | implícitas | Primeiro corte se faltar tempo |
| 7 | polish + demo | — | — | Small | — | — | Estados vazio/erro, acessibilidade, fontes Fraunces/DM Sans, anel de 12 pontos, README, seed; tema escuro só se sobrar tempo |

Regra de segurança do skill: se uma feature "Medium" revelar mais de 5 passos ou dependências complexas ao listar os passos, parar e criar `tasks.md` formal.

## Cronograma sugerido

| Janela | Entrega | Critério de saída |
|---|---|---|
| 07/10 manhã | `foundation` completa | 3 gates verdes; import entre módulos quebra o lint |
| 07/10 tarde | `auth` + `circles` | Registrar, entrar, criar círculo e entrar por código no web |
| 07/10 noite | `pacts` | CRUD + check-in + progresso coletivo |
| 08/10 manhã | `stories` (feed finito); `meetups` só se sobrar tempo | Feed termina em "você chegou ao fim" |
| 08/10 antes da apresentação | polish, README, seed, roteiro | Demo ensaiada |

**Linha de corte** (do que cai primeiro): reações (STORY-06/07) → `meetups` → botão "preciso de apoio" (fora de escopo atual). `foundation`, `auth`, `circles`, `pacts` e o feed de `stories` cobrem todos os requisitos da disciplina.

## Cobertura dos requisitos da disciplina

| Requisito | Specs que atendem |
|---|---|
| Interface mobile, 3+ telas, navegação | foundation, auth, circles, pacts, stories |
| Formulário e validação | AUTH-02, CIR-01, PACT-01, STORY-01 |
| API / Web Service | AD-003 (Supabase Auth + REST) |
| Exibição de dados | CIR-06/07, PACT-02/06, STORY-03 |
| CRUD | PACT-01, 02, 08, 09 |
| Tratamento de erros | FND-05, AUTH-06, estados de erro nas listas |

## Pendências do usuário

- Antes de `auth`: URL e chave `anon` do Supabase em `.env` (fora do git); desligar "Confirm email".
- Em `circles`, `pacts`, `stories`, `meetups`: rodar no SQL Editor a migration gerada em `supabase/migrations/`.
- Decidir o que entra no commit inicial (hoje nada foi commitado; `.claude/`, `.cursor/`, `.windsurf/` e `.agents/` estão como não rastreados). Sugestão: commitar `.specs/` e `docs/` e deixar as pastas de skills fora via `.gitignore`.

## Diferenças em relação ao PLANO.md

- Etapas viraram **features com requisitos rastreáveis** (IDs `FND-`, `AUTH-`, `CIR-`, `PACT-`, `STORY-`, `MEET-`) e critérios EARS testáveis.
- Regras de negócio que o plano deixava implícitas foram decididas e registradas como premissas em cada spec (limites de campos, definição de "dia", regras de reação, quem edita pactos, etc.).
- Cada feature tem verificação independente ao final, em vez de só validação manual.
- Decisões de arquitetura saíram do plano e foram para `STATE.md` (AD-001..005).
- Reordenação: `pacts` vem antes de `stories` e `meetups`, e o tempo restante está explícito.
