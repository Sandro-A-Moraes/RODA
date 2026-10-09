# Roda — Figma screen prototypes

Figma file: https://www.figma.com/design/x3ZwVucRW34c4LfJ5rQLff (file key `x3ZwVucRW34c4LfJ5rQLff`), named "Roda - Telas do App".

These screens are the **visual reference for the app UI**. When implementing a screen, read the matching frame with the Figma MCP (`get_design_context` on its node ID) and follow it. Colors and type come from `docs/DESIGN_SYSTEM.md`; layout, spacing and hierarchy come from these frames. Frame size is 390 × 844 (iPhone-class), and the horizontal screen padding is 16 (24 on the auth screens).

## Status

All 25 screens are built and were checked visually.

## Screens

| # | Frame | Node ID | Spec | Notes |
|---|---|---|---|---|
| 01 | Entrar | `7:8` | AUTH | Ring motif, display title, e-mail and password |
| 02 | Criar conta | `7:53` | AUTH | Shows validation: field error on e-mail, hint on password |
| 03 | Círculos | `7:103` | CIR-06 | Circle cards with member dots, tab bar, "Entrar com código" |
| 04 | Círculos (vazio) | `7:194` | CIR-06 AC3 | Empty state with "Criar círculo" and "Entrar com código" |
| 05 | Entrar com código | `7:242` | CIR-03/04 | Six code boxes, error state "Código não encontrado" |
| 06 | Novo círculo | `7:283` | CIR-01 | Name field with the 2 to 40 characters rule |
| 07 | Círculo · Pactos | `8:200` | PACT-02 | Pact cards with collective progress and "Feito hoje" badge |
| 08 | Círculo · Relatos | `8:276` | STORY-03/05 | "Você já compartilhou hoje" notice, finite feed, end marker, qualitative reactions, no counters |
| 09 | Círculo · Encontros | `8:358` | MEET-03/04 | Meetup cards with "Eu vou" / "Não vou" |
| 10 | Círculo · Membros | `8:451` | CIR-07 | Invite code card and member list |
| 11 | Pacto | `8:547` | PACT-03/06/08/09 | Progress ring "5 de 7", "Fazer check-in", edit and "Apagar pacto" for the creator |
| 12 | Novo pacto | `8:586` | PACT-01 | Validation error on the title |
| 13 | Apagar pacto | `11:488` | PACT-09 | Confirmation dialog over the pact screen, "Apagar" and "Cancelar" |
| 14 | Novo relato | `11:518` | STORY-01/02 | Composer with the "N de 280" counter, one story per day |
| 15 | Propor encontro | `22:545` | MEET-01/02 | Title, place, date and time. Shows validation ("Hora inválida"). The creator is automatically "Eu vou" |
| 16 | Perfil | `11:543` | AUTH | Replaces the placeholder home; user card and "Sair". Tab bar with Perfil active |
| 17 | Círculo · Relatos (sem relato hoje) | `22:601` | STORY-01/02 | Feed state before posting: the composer prompt "Escrever relato" opens screen 14. After posting, the prompt is replaced by the notice in screen 08 |

| 18 | Círculo · Pactos (vazio) | `24:616` | PACT-02 AC6 | Empty state with "Criar pacto" |
| 19 | Círculo · Relatos (vazio) | `24:704` | STORY-04 | "Ninguém compartilhou ainda", no end marker, "Escrever relato" |
| 20 | Círculo · Encontros (vazio) | `24:798` | MEET-03 AC5 | Empty state with "Propor encontro" |

| 21 | Splash | `29:748` | — | Shown on every app launch while the session is restored. Forest background, 12-dot ring, "Roda" wordmark, no status bar |
| 22 | Onboarding 1 | `29:765` | — | "Um círculo pequeno, de gente que você conhece." Ring of 12 dots; "Pular" and "Continuar" |
| 23 | Onboarding 2 | `29:807` | — | "Combinem um pacto e cumpram juntos." Collective progress ring, no ranking; "Pular" and "Continuar" |
| 24 | Onboarding 3 | `29:840` | — | "Um relato por dia. Depois, o encontro." Story card and end marker; "Começar" and "Já tenho conta" |

| 25 | Encontro (detalhe) | `37:794` | MEET-04 AC3 | Opens from a meetup card: date, title and place, names of who is going with the count, "Eu vou" and "Não vou" |

Launch flow: **Splash** (every launch, while the session is restored) → if the user is signed in, go to Círculos. If not, and it is the first launch, show **Onboarding 1 to 3** (store a "seen" flag locally, for example in AsyncStorage) and then go to Criar conta; "Já tenho conta" and "Pular" lead to Entrar or Criar conta. If it is not the first launch and the user is signed out, go straight to Entrar. The page indicator is three dots; the active one is a longer terracotta pill.

The Membros tab has no empty state: the creator is always a member. Loading states follow the specs (a loading indicator in place of the list). The error state is the `ErrorBanner` component with a retry action, and it is not drawn on every screen.

Navigation model: bottom tab bar with **Círculos** and **Perfil** on root screens only. Inside a circle, the screens are a stack with a top tab strip (Pactos · Relatos · Encontros · Membros).

Story flow: screen 17 (feed, nothing posted today) → "Escrever relato" → screen 14 (composer) → screen 08 (feed with the "Você já compartilhou hoje" notice).

## Components (page "Componentes")

Every screen is assembled from instances of these. Reuse them instead of redrawing.

| Component | Node ID | Variants and properties |
|---|---|---|
| Button | `2:52` | Variant (Primary, Secondary, Ghost, Destructive) × State (Default, Disabled) × Size (Default, Small); `Label` |
| TextField | `2:73` | State (Default, Filled, Focused, Error); `Label`, `Value`, `Helper`, `Show Helper` |
| Chip | `2:80` | Selected (False, True); `Label`. Reaction chips, never with counts |
| Avatar | `2:19` | Tone (Brand, Accent, Sage); `Initial` |
| ErrorBanner | `3:2` | `Message`, `Action` (retry) |
| TabBar | `3:32` | Active (Circulos, Perfil) |
| Header | `3:66` | Back (True, False) × Action (None, Plus, Edit); `Title` |
| SegTabs | `3:119` | Active (Pactos, Relatos, Encontros, Membros) |
| EmptyState | `3:120` | `Title`, `Body` |
| CircleCard | `4:2` | `Name`, `Members`; dots `dot-1` to `dot-12` are filled per member |
| PactCard | `4:21` | `Title`, `Description`, `Progress`, `Percent`, `Done`; `fill` bar width = percentage |
| StoryCard | `4:35` | `Author`, `Date`, `Text`, `Show Reactions`, `Received`, `Show Received` |
| MeetupCard | `4:49` | `Day`, `Month`, `Title`, `Place`, `When`, `Going` |
| MemberRow | `4:78` | `Name`, `Tag`, `Show Tag` |
| StatusBar, HomeIndicator | `2:2`, `2:11` | Device chrome, not part of the app UI |

Component names map naturally to React components under `src/shared/ui` (only when a second module needs them) or inside the owning module's `presentation/components`. Follow the rule in `docs/PROJECT_CONTEXT.md`: create a component only when needed.

## Variables and styles

- **Palette** (9 colors), **Color** (16 semantic roles), **Spacing** (xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48), **Radius** (sm 8, md 14, lg 20, xl 28, full).
- Text styles: `display` 40, `numeral` 56, `heading/h1` 32, `heading/h2` 24, `heading/h3` 20 (all Fraunces SemiBold), `body/lg` 18, `body` 16, `body/strong`, `caption` 14, `caption/strong`, `button` 16, `label` 12 uppercase (DM Sans).
- The spacing scale matches `src/core/theme/tokens.ts`. The type scale there (14, 16, 20, 28) is smaller than this one, so extend `typography.sizes` when implementing, and load Fraunces and DM Sans (the polish step in `.specs/ROADMAP.md`).
- Only the **light** theme exists. The Starter Figma plan allows one mode per variable collection, so there is no dark mode in the file.

## Design rules visible in the frames

- Primary action is forest (`brand`), not terracotta. Terracotta (`accent`) is for emphasis, progress, errors and links.
- Cards are `surface` (sand) on the cream background; hero blocks are `surface-inverse` (forest) with cream text.
- Unselected chips use a border, because a sand fill disappears on a sand card.
- The 12-dot ring is the product motif. It appears on auth, empty states, circle cards and the invite card.
- No ranking, no counters, no per-person progress anywhere (AD-005).
