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

- **Feature**: circles (`.specs/features/circles/`) - done and Verifier PASS (`validation.md`, 18/18 mutants killed); screens aligned to Figma frames 03, 04, 05, 06, 10; manual check on the real backend partly done
- **Phase / Task**: circles closed except the two-account manual checks; pacts code exists (commit 3ee4031) but has no tasks.md / validation.md yet
- **Completed**: foundation T1-T22; auth T1-T24 (verified, manually tested by the user); circles T1-T12 plus Figma alignment (empty state, join, new circle, members ring) and fix for pasted invite codes with spaces; fonts Fraunces and DM Sans now load in `app/_layout.tsx` (added `expo-asset`); `ring.tsx`/`icon.tsx` no longer pass `accessible` to Svg; `0001` and `0002` migrations applied to RODA (`fsckgwcwweblvyyywvis`), 323 tests green
- **Manually verified on web (user's account)**: empty state, name validation, create circle (lands on Membros with the code), unknown code, joining own circle ("Você já faz parte"), list with one circle
- **Not verified (needs a second account)**: join with another user's code, member names from `profiles_select_circle_mates`, 13th member rejected, RLS isolation from a third account
- **Lessons**: (1) Metro caches the route map; after adding route files restart with `npx expo start --web --clear`, otherwise `Stack.Protected` does not cover new groups and sign-out does not redirect. (2) Supabase Data API must stay enabled with `public` in Exposed schemas, otherwise every REST call returns 503 PGRST002 (log: `pg_pgrst_no_exposed_schemas`)
- **Test data**: circle "ATeste Roda" (code J8FW57) exists on the remote project; delete before the demo
- **Remaining features**: pacts (spec/tasks/Verifier), stories, meetups (roadmap order); polish + demo; Figma screen 15 (propose meetup) is not drawn
- **Next step**: pacts: write tasks.md for the existing code, add tests per PACT AC, align screens to Figma frames 07, 11, 12, 13, then the Verifier
- **Blockers**: none; the in-app browser session got signed out after a reload, sign in again to resume manual checks
- **Uncommitted files**: `.claude/launch.json` (preview config, optional)
- **Branch**: main (local commits ahead of origin, not pushed)
