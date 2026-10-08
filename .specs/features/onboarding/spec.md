# Onboarding Specification

## Problem Statement

The app opens on a bare loading spinner and drops a new visitor straight on the sign-in form, without saying what Roda is. A splash on every launch (Figma 21) gives the restore wait a face, and three short onboarding screens on the first launch (Figma 22-24) explain the small circle, the collective pact and the daily story before asking for an account.

## Goals

- [ ] Every launch shows the splash until the session and the onboarding flag are known, for at least 1200 ms.
- [ ] A signed-out visitor sees the three onboarding screens once per device; after any exit the app goes straight to Entrar.
- [ ] A signed-in user never sees onboarding.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Swipe gestures between onboarding pages | Buttons cover the flow; a pager adds a dependency and test surface |
| A "Voltar" action between pages | Not in Figma 22-24 |
| Resetting the flag from the app (e.g. on the profile screen) | Not requested; clearing the app data resets it |
| Syncing the flag to the account (Supabase) | The flag is per device by decision |
| Animated splash or native splash configuration (`app.json`) | Expo Go keeps its own native splash; this is the in-app splash only |
| Meetups | Continued later by the user |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Minimum splash duration | 1200 ms from the moment the launch navigator mounts; a prop overrides it (tests pass 0) | Long enough to be seen, short enough not to annoy; tests must not wait | y |
| Storage of the flag | AsyncStorage key `roda.onboarding.seen` with value `"true"`; absent means unseen | One key, readable on native and web (localStorage under AsyncStorage) | y |
| Read failure | Treated as seen | Never trap the user in onboarding | y |
| Write failure | Ignored; the app continues and treats the flag as seen for the rest of the session | The user already chose an exit; a storage error must not block navigation | y |
| Exits that store the flag | "Pular" (pages 1 and 2), "Começar" and "Já tenho conta" (page 3) | Closing the app mid-way without an exit leaves the flag unset | y |
| "Pular" destination | Criar conta | Figma launch-flow note: onboarding ends on Criar conta | y |
| Page 3 has no "Pular" | The skip slot is empty on Figma 24 | Copy the frame | y |
| Signing in on a device whose flag is unset (e.g. deep link to /sign-in on the first launch) | The flag is stored when the session becomes signed in | Otherwise a later sign-out would show onboarding to someone who already has an account, contradicting "signing out does not bring onboarding back" | y |
| Illustrations ("12 pessoas, no máximo", "5 de 7", sample story "Beto Lima") | Static, decorative, hidden from screen readers | They illustrate the product, they are not data and not counters of anyone (AD-005) | y |
| Splash accessible label | "Roda. Carregando" | Says what the screen is and that it is waiting | y |
| Splash tagline | "Menos tela. Mais roda." under the wordmark | Present in Figma 21 | y |
| Composition | The onboarding module composes the auth `RootNavigator` (AD-008) | Keeps auth unaware of onboarding and the module-boundary lint unchanged | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Splash on every launch ⭐ MVP

**User Story**: As anyone opening Roda, I want a branded screen while the app gets ready so that the wait feels intentional.

**Why P1**: It replaces the bare spinner shown on every launch.

**Acceptance Criteria**:

1. WHILE the session is being restored the system SHALL show the splash with the 12-dot ring, the wordmark "Roda" and the text "Menos tela. Mais roda." on the forest (`inverse`) background, and SHALL NOT render any route content.
2. WHILE the onboarding flag is being read the system SHALL show the splash and SHALL NOT render any route content.
3. WHILE less than the minimum splash duration (1200 ms by default) has passed since launch the system SHALL keep showing the splash even if the session and the flag are already known.
4. The splash SHALL expose the accessible label "Roda. Carregando".
5. WHILE the splash is shown the system SHALL hide the device status bar.

**Independent Test**: Launch with a session restore that never resolves and see only the splash; launch with a resolved session and a minimum duration and see the splash until the duration ends.

---

### P1: Launch routing ⭐ MVP

**User Story**: As a returning or new user, I want the app to open on the right screen so that I do not repeat steps.

**Why P1**: It decides between Círculos, onboarding and Entrar on every launch.

**Acceptance Criteria**:

1. WHEN the launch completes with a signed-in session THEN the system SHALL open the main area (Círculos) and SHALL NOT render onboarding.
2. WHEN the launch completes signed out and the flag is unset THEN the system SHALL open onboarding page 1.
3. WHEN the launch completes signed out and the flag is set THEN the system SHALL open Entrar (sign-in).
4. IF a signed-in user opens the onboarding route THEN the system SHALL redirect to the main area.
5. IF a signed-out user opens the onboarding route while the flag is set THEN the system SHALL redirect to Entrar.
6. WHEN the session becomes signed in while the flag is unset THEN the system SHALL store the flag.
7. WHEN a user signs out after the flag is set THEN the system SHALL open Entrar and SHALL NOT render onboarding.

**Independent Test**: With in-memory stores, launch the three combinations (signed in, signed out unseen, signed out seen) and check the landing route.

---

### P1: Onboarding pages ⭐ MVP

**User Story**: As a new visitor, I want three short screens explaining Roda so that I know what I am signing up for.

**Why P1**: It is the first explanation of the product thesis.

**Acceptance Criteria**:

1. WHILE page 1 is shown the system SHALL show the title "Um círculo pequeno, de gente que você conhece.", the body "No Roda não há seguidores nem perfil público. São no máximo 12 pessoas próximas.", the 12-dot ring with "12" and "pessoas, no máximo", and the actions "Pular" and "Continuar".
2. WHILE page 2 is shown the system SHALL show the title "Combinem um pacto e cumpram juntos.", the body "Todo dia cada pessoa faz o check-in. O círculo vê o progresso do grupo, nunca um ranking.", the collective progress ring card with "5 de 7" and "fizeram o check-in hoje", and the actions "Pular" and "Continuar".
3. WHILE page 3 is shown the system SHALL show the title "Um relato por dia. Depois, o encontro.", the body "Conte o que fez fora da tela, reaja sem curtidas e marque um encontro de verdade.", a sample story card followed by the end marker "você chegou ao fim", and the actions "Começar" and "Já tenho conta", and SHALL NOT show "Pular".
4. WHEN the user presses "Continuar" on page 1 THEN the system SHALL show page 2.
5. WHEN the user presses "Continuar" on page 2 THEN the system SHALL show page 3.
6. The system SHALL show a page indicator of three dots in which only the current page is the longer accent pill, and SHALL expose it to screen readers as "Página N de 3" for page N.
7. The system SHALL give every onboarding action an accessible button label equal to its visible text.
8. The system SHALL hide the illustrations (ring, progress card, sample story) from screen readers and SHALL NOT offer any interaction inside them.

**Independent Test**: Render the onboarding screen, read each page's texts and indicator label, and move with "Continuar".

---

### P1: Exits and the seen flag ⭐ MVP

**User Story**: As a visitor, I want onboarding to end where I choose and never come back so that it is shown only once.

**Why P1**: Without it onboarding would repeat on every launch.

**Acceptance Criteria**:

1. WHEN the user presses "Pular" on page 1 or 2 THEN the system SHALL open Criar conta (register) and store the flag.
2. WHEN the user presses "Começar" on page 3 THEN the system SHALL open Criar conta (register) and store the flag.
3. WHEN the user presses "Já tenho conta" on page 3 THEN the system SHALL open Entrar (sign-in) and store the flag.
4. IF the app is closed on any onboarding page without one of these exits THEN the system SHALL leave the flag unset, so the next signed-out launch opens onboarding page 1.
5. WHEN the flag has been stored THEN the next signed-out launch on that device SHALL open Entrar.

**Independent Test**: Press each exit with an in-memory store and check the destination route and that `hasSeen()` resolves `true`; render without pressing an exit and check it stays `false`.

---

### P1: Flag persistence ⭐ MVP

**User Story**: As the app, I need to remember the flag across restarts without ever blocking the user.

**Why P1**: The flag is what makes onboarding first-launch only.

**Acceptance Criteria**:

1. The production store SHALL persist the flag in AsyncStorage under the key `roda.onboarding.seen` with the value `"true"` and SHALL report unseen when the key is absent.
2. IF reading the flag fails THEN the system SHALL treat it as set (seen).
3. IF writing the flag fails THEN the system SHALL ignore the error, complete the navigation of the exit and treat the flag as set for the rest of the session.

**Independent Test**: Run the store against a fake key-value storage; run the provider against a store whose read and write reject.

---

## Edge Cases

- IF reading the flag fails THEN the system SHALL open Entrar for a signed-out user (ONB-05 AC2).
- IF writing the flag fails THEN the system SHALL still open the chosen destination (ONB-05 AC3).
- WHEN the session and the flag resolve before the minimum duration THEN the system SHALL keep the splash until it ends (ONB-01 AC3).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ONB-01 | P1: Splash on every launch | Execute | Implemented |
| ONB-02 | P1: Launch routing | Execute | Implemented |
| ONB-03 | P1: Onboarding pages | Execute | Implemented |
| ONB-04 | P1: Exits and the seen flag | Execute | Implemented |
| ONB-05 | P1: Flag persistence | Execute | Implemented |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] A fresh device signed out goes splash, then onboarding 1, 2, 3, then Criar conta; the next launch goes splash, then Entrar.
- [ ] A signed-in launch goes splash, then Círculos, with no onboarding frame rendered.
- [ ] No hex literal outside `src/core/theme`; lint, typecheck and tests green.
