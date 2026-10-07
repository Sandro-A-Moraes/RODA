# Foundation Specification

## Problem Statement

Roda needs a runnable Expo project with enforced architecture, test tooling and a minimal shared base before any feature can be built test-first. Without it, the module boundaries in AD-001 are conventions instead of guarantees.

## Goals

- [ ] App launches in Expo Go and on web with a blank themed screen.
- [ ] `npm test`, `npm run typecheck` and `npm run lint` all exit 0 on a clean tree.
- [ ] Cross-module internal imports fail lint.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Supabase client and `.env` loading | Delivered by `auth` (first consumer) |
| Any domain entity | Belongs to each feature module |
| Custom fonts beyond system fallback | Fraunces/DM Sans are polish, handled in the final phase |
| Dark theme in the UI (toggle, system following) | `docs/DESIGN_SYSTEM.md`: light first, dark only if time allows; only the `darkColors` tokens ship here |
| The 12-dots ring motif | Decorative; belongs to polish |
| Component library beyond 5 primitives | AD-001 rule: create components only when needed |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Package manager | npm | Scripts in the plan and context use `npm run` | y |
| Result type shape | `{ ok: true, value } or { ok: false, error: AppError }` | Discriminated union is idiomatic and narrows in TypeScript | n |
| AppError codes | `network`, `validation`, `unauthorized`, `not_found`, `conflict`, `unknown` | Covers every failure the course requires to handle, small enough to switch over exhaustively | n |
| Fonts | System font in this feature; typography tokens leave the font family replaceable | Custom fonts add load-state complexity with no requirement behind them | n |
| Color source of truth | `docs/DESIGN_SYSTEM.md` | User-provided official palette shared with the case deck | y |
| Active theme | Light only; `useTheme` returns light colors | The design system ships light first | y |
| Hex ban enforcement | ESLint rule (`no-restricted-syntax` on hex literals) with `src/core/theme/` exempt | Makes "never hardcode a hex" a gate instead of a convention | n |
| Import aliases | `@/core`, `@/shared`, `@/modules` | Matches the documented layout | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Runnable, verifiable project ⭐ MVP

**User Story**: As a developer, I want a configured Expo project with test, type and lint gates so that every later feature can be built test-first and verified automatically.

**Why P1**: Every other feature depends on it.

**Acceptance Criteria**:

1. WHEN the developer runs `npx expo start` THEN the app SHALL render a single blank screen using the `background` color role of the light theme (`cream`, `#F5EEDF`) without runtime errors.
2. WHEN the developer runs `npm test` THEN Jest SHALL execute at least one passing smoke test and exit 0.
3. WHEN the developer runs `npm run typecheck` THEN TypeScript SHALL report zero errors under `strict: true`.
4. WHEN the developer runs `npm run lint` THEN ESLint SHALL exit 0 on the clean tree.
5. IF a file in one module imports a non-`index.ts` path of another module THEN `npm run lint` SHALL fail with a boundary-violation error.
6. IF a file under any `domain/` folder imports `react`, `react-native`, `expo` or `@supabase/supabase-js` THEN `npm run lint` SHALL fail.
7. The project SHALL define import aliases `@/core`, `@/shared` and `@/modules` resolved by TypeScript, Jest and the Expo bundler.

**Independent Test**: Run the three scripts and the app; add a deliberate cross-module import and watch lint fail.

---

### P1: Core error model and theme

**User Story**: As a developer, I want a typed error model, theme tokens and a dependency provider so that features share one vocabulary for failures, styling and wiring.

**Why P1**: Features translate infrastructure errors into `AppError` and read design tokens from here.

**Acceptance Criteria**:

1. The system SHALL expose `AppError` with a `code` from the fixed set in the Assumptions table and a pt-BR `message`.
2. The system SHALL expose `Result<T>` with `ok(value)` and `err(error)` helpers that narrow correctly in TypeScript.
3. WHEN an unknown thrown value is passed to the error mapper THEN the system SHALL return an `AppError` with code `unknown` and message "Algo deu errado. Tente novamente.".
4. WHEN a network failure is passed to the error mapper THEN the system SHALL return an `AppError` with code `network` and message "Sem conexão. Verifique sua internet e tente novamente.".
5. The system SHALL define in `src/core/theme/colors.ts` the 9-color `palette` (`forest`, `forest2`, `cream`, `sand`, `terra`, `glow`, `sage`, `ink`, `muted`) with the exact hex values of `docs/DESIGN_SYSTEM.md`, and `lightColors` with the 8 semantic roles (`background`, `backgroundAlt`, `surface`, `textPrimary`, `textSecondary`, `accent`, `onAccent`, `decorative`) mapped as in that document.
6. The system SHALL define `darkColors` with the same 8 roles mapped as in `docs/DESIGN_SYSTEM.md`, and typography sizes and spacing tokens in `src/core/theme`.
7. IF a file under `src/` other than `src/core/theme/` contains a hex color literal THEN `npm run lint` SHALL fail.
8. The system SHALL provide a `useTheme` hook that returns the light theme colors.
9. WHEN a component under test requests a dependency that was registered in `DependencyProvider` THEN the provider SHALL return that instance.
10. IF a component requests a dependency that was not registered THEN the provider SHALL throw an error naming the missing dependency.

**Independent Test**: Unit tests on the mapper, Result helpers and provider; no UI needed.

---

### P1: Shared UI primitives

**User Story**: As a user, I want consistent, accessible form controls so that screens look and behave the same everywhere.

**Why P1**: The `auth` screens need them immediately.

**Acceptance Criteria**:

1. The system SHALL provide `Screen`, `Text`, `Button`, `TextField` and `ErrorBanner` in `src/shared/ui`, styled only through semantic color roles and never through raw palette names or hex values.
2. WHEN a `Button` is pressed while enabled THEN it SHALL call its `onPress` handler once.
3. WHILE a `Button` is in `loading` or `disabled` state it SHALL NOT call `onPress`.
4. The `Button` and `TextField` SHALL have a minimum touch target height of 44.
5. WHEN a `TextField` receives an `error` string THEN it SHALL display that string below the input and expose it to accessibility.
6. WHEN `ErrorBanner` receives an `AppError` THEN it SHALL display the error message.
7. WHERE `ErrorBanner` receives an `onRetry` handler it SHALL show a "Tentar novamente" button that calls it.
8. The primary `Button` SHALL use `accent` as background and `onAccent` as text color, and `ErrorBanner` SHALL use `accent` as background and `onAccent` as text color (`cream` on `terra`, 4.64:1).
9. The `Text` component SHALL default to `textPrimary` and offer a `secondary` variant using `textSecondary`.

**Independent Test**: React Native Testing Library render and press tests per component.

---

## Edge Cases

- IF `Result` helpers receive `undefined` as a value THEN the system SHALL still return `ok: true` with `value` undefined.
- WHEN `ErrorBanner` receives no error THEN the system SHALL render nothing.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FND-01 | P1: Runnable project (AC 1) | Specify | Pending |
| FND-02 | P1: Runnable project (AC 2-4) | Execute | Done |
| FND-03 | P1: Runnable project (AC 5-6) | Specify | Pending |
| FND-04 | P1: Runnable project (AC 7) | Specify | Pending |
| FND-05 | P1: Core error model and theme (AC 1-4) | Specify | Pending |
| FND-06 | P1: Core error model and theme (AC 5-6, 8) | Specify | Pending |
| FND-07 | P1: Core error model and theme (AC 9-10) | Specify | Pending |
| FND-08 | P1: Shared UI primitives (AC 1-5) | Specify | Pending |
| FND-09 | P1: Shared UI primitives (AC 6-7) | Specify | Pending |
| FND-10 | P1: Core error model and theme (AC 7) and Shared UI (AC 8-9) | Specify | Pending |

**Coverage:** 10 total, 0 mapped to tasks, 10 unmapped ⚠️

---

## Success Criteria

- [ ] A fresh clone runs `npm install && npm test && npm run typecheck && npm run lint` green.
- [ ] A deliberate boundary violation is rejected by lint.
