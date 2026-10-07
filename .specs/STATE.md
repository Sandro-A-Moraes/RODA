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

- **Feature**: auth (`.specs/features/auth/`) - verified (PASS) and restyled to the Figma frames 01 Entrar, 02 Criar conta, 16 Perfil
- **Phase / Task**: Execute done for auth; Design/Tasks for `circles` not started
- **Completed**: foundation T1-T22; auth T1-T24; Figma tokens (`brand`, `onBrand`, `card`, `inverse`, ... roles), fonts Fraunces/DM Sans, base UI (Text types, Button variants, TextField, Icon, Ring, Avatar, Chip, Card, Header, EmptyState, Reveal with GSAP on web); `supabase/migrations/0001_profiles.sql` applied to RODA (`fsckgwcwweblvyyywvis`), advisors clean
- **Out-of-scope work parked**: a first pass of circles/pacts code and `0002_circles_pacts_stories.sql` is in `git stash` ("out-of-scope: circles/pacts/stories WIP"). **0002 was applied to the remote RODA project by mistake of scope** (tables circles, circle_members, pacts, check_ins, stories, story_reactions plus RPCs); decide whether to keep it or drop it before the circles spec work
- **Remaining features**: circles, pacts, stories, meetups (roadmap order); polish + demo; Figma screen 15 (propose meetup) is not drawn
- **Next step**: walk the auth Independent Tests on `npx expo start --web`; then Design/Tasks for `circles` with subagents per the TLC skill
- **Blockers**: none
- **Uncommitted files**: `docs/FIGMA_SCREENS.md` (user's)
- **Branch**: main
