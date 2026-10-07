# STATE

## Decisions

### AD-001
- **Decision**: Each feature is a module (`domain/`, `data/`, `presentation/`, `__tests__/`, `index.ts`) following clean architecture; dependencies point `presentation → domain ← data`.
- **Reason**: Keeps domain logic testable offline and lets the repository implementation be swapped without touching use cases.
- **Trade-off**: More files and indirection than a flat Expo app, in a project with a very short deadline.
- **Scope**: All features under `src/modules/`.
- **Date**: 2026-10-07
- **Status**: active

### AD-002
- **Decision**: Every module defines a repository interface in `domain` with two implementations, `InMemory` (tests, early development) and `Supabase` (production), wired through a dependency-injection provider.
- **Reason**: Tests and domain TDD run without network; the real backend is validated manually.
- **Trade-off**: Two implementations to keep behaviorally aligned; Supabase code has no automated coverage.
- **Scope**: All features with persistence.
- **Date**: 2026-10-07
- **Status**: active

### AD-003
- **Decision**: The backend is Supabase only (Auth + Postgres + PostgREST) with mandatory Row Level Security on every table; no custom server code.
- **Reason**: Satisfies the API requirement of the course with zero server work; RLS enforces circle-scoped access.
- **Trade-off**: Business rules that need atomicity (12-member cap, one check-in per day) must live in SQL constraints/policies as well as in the domain.
- **Scope**: `supabase/migrations/`, every `data/` layer.
- **Date**: 2026-10-07
- **Status**: active

### AD-004
- **Decision**: The app must run in Expo Go; only Expo-managed libraries, no custom native modules or dev builds.
- **Reason**: The team has no reliable physical device and must verify on web or an Android emulator.
- **Trade-off**: No real screen-time measurement or native integrations.
- **Scope**: All dependencies.
- **Date**: 2026-10-07
- **Status**: active

### AD-005
- **Decision**: The product anti-features are permanent: no infinite scroll, no like counters or popularity metrics, no followers or public profiles, no algorithmic ranking, no engagement-bait notifications.
- **Reason**: They are the thesis of the product, not omissions.
- **Trade-off**: Fewer "engaging" mechanics to fill the demo.
- **Scope**: Every feature spec and design.
- **Date**: 2026-10-07
- **Status**: active

### AD-006
- **Decision**: Components consume semantic color roles (`background`, `textPrimary`, `accent`, `onAccent`, ...) from `src/core/theme`, never palette names or hex values; the palette lives in `docs/DESIGN_SYSTEM.md` and `src/core/theme/colors.ts`. Lint rejects hex literals outside `src/core/theme/`.
- **Reason**: The identity can change in one mapping, a dark theme can be added without touching components, and only contrast-approved text/background pairs are reachable.
- **Trade-off**: One more layer of indirection; roles limit available colors (no free-form tints).
- **Scope**: All `presentation/` code and `shared/ui`.
- **Date**: 2026-10-07
- **Status**: active

### AD-007
- **Decision**: The signed-in user is read through `useSession()` exported from `@/modules/auth`; routes are protected declaratively with Expo Router `Stack.Protected` groups `(auth)` and `(app)` driven by that session. Other modules never import auth internals or call Supabase Auth directly.
- **Reason**: One source of truth for identity and redirects; keeps module boundaries (AD-001) and avoids per-screen auth checks.
- **Trade-off**: Route group names are coupled to the root navigator; renaming a group requires updating `RootNavigator` and its test.
- **Scope**: `app/` routing, every feature that needs the current user id.
- **Date**: 2026-10-07
- **Status**: active

## Handoff

- **Feature**: auth (`.specs/features/auth/`) - spec, design and tasks written (Draft), not yet approved
- **Phase / Task**: Tasks done; waiting for user approval of design.md and tasks.md before Execute
- **Completed**: foundation T1-T22 (verified PASS); auth: none of T1-T24
- **In-progress** (file:line): none
- **Next step**: User approves auth design and tasks (and the unconfirmed spec defaults: 8-char password, name 2-40); then Execute T1 (offer batch sub-agents: P1 | P2 | P3+P4 | P5). After T24: manual verification (confirm-email off, apply `supabase/migrations/0001_profiles.sql` with explicit go-ahead, walk the Independent Tests)
- **Blockers**: none (Supabase project RODA `fsckgwcwweblvyyywvis` is empty; `.env` is filled)
- **Uncommitted files**: `.specs/STATE.md`, `.specs/features/auth/design.md`, `.specs/features/auth/tasks.md`
- **Branch**: main
