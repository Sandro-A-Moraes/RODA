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

## Handoff

- **Feature**: `foundation` is done and verified (PASS, `.specs/features/foundation/validation.md`); the user confirmed the blank cream screen on web with no console errors. `auth` is next, not started.
- **Phase / Task**: Between features. Next: Design and Tasks for `auth` (`.specs/features/auth/spec.md` is approved).
- **Completed**: foundation T1-T22 and the test-only fix commit. Specs for all six features approved. `.env.example` added; the user created `.env` with the Supabase URL and publishable key (variables `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- **In-progress** (file:line): none
- **Next step**: Run Design (short) and Tasks for `auth`: Supabase client in `src/core`, `AuthRepository` interface with InMemory and Supabase implementations, use cases, Zod schemas, auth provider, screens, route protection. Then execute with sub-agents (user prefers batches of ~7 tasks) and finish with the Verifier. Then `circles` and the rest per `.specs/ROADMAP.md`.
- **Blockers**: none. The Supabase MCP connector is connected (tools `apply_migration`, `execute_sql`, `list_tables`, `get_advisors`, ...): use it to apply SQL, always also saving each migration under `supabase/migrations/`. Show the SQL summary and get the user's OK before applying structural changes; never run anything that deletes data unasked. The user still needs to disable "Confirm email" in Supabase (Authentication > Providers > Email) before `auth` can be tried end to end.
- **Uncommitted files**: none
- **Branch**: main (tracks origin/main; the user authorized pushing there after commits)
