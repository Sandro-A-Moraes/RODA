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

### AD-008
- **Decision**: The launch flow lives in the `onboarding` module, which composes the auth `RootNavigator` through the auth public API (`RootNavigator`, `useSession`). `RootNavigator` takes the launch pieces as props (`splash`, `holdSplash`, `showOnboarding`) and never imports onboarding; `LaunchNavigator` (onboarding) reads the session and the device flag and renders `RootNavigator` with them. `app/_layout.tsx` renders `OnboardingProvider` + `LaunchNavigator` inside `SessionProvider`.
- **Reason**: Dependencies point one way (onboarding -> auth index), so there is no import cycle and the module-boundary lint needs no exception; auth stays testable without onboarding, and the launch logic (minimum splash, flag, mark seen on sign-in) is testable in the module with `renderRouter`.
- **Trade-off**: The root navigation is split across two modules; adding a signed-out route still means editing `RootNavigator`, and the onboarding route name `(auth)/onboarding` is known by auth.
- **Scope**: `src/modules/auth/presentation/root-navigator.tsx`, `src/modules/onboarding/`, `app/_layout.tsx`.
- **Date**: 2026-10-07
- **Status**: active

## Handoff

- **Feature**: circles (`.specs/features/circles/`) - done and Verifier PASS (`validation.md`, 18/18 mutants killed); screens aligned to Figma frames 03, 04, 05, 06, 10; manual check on the real backend done
- **Pacts (2026-10-07)**: done in code and Verifier PASS (`.specs/features/pacts/validation.md`, 22/23 mutants killed; the survivor is the check-in cascade, unobservable in memory); screens aligned to Figma frames 07, 11, 12, 13; 436 tests green, typecheck and lint clean
- **Pacts manual check (done by the user, web, two accounts)**: passed. Migration 0003 applied to RODA on 2026-10-07. Pacts are closed. Also fixed the web warning `collapsable` in `ProgressRing` (commit 5d6244e)
- **Pacts spec gap (resolved 2026-10-07)**: Figma frame 11 (`8:547`) shows the label "HOJE" above "5 de 7" on the pact detail, which the code already renders ("Hoje" with the uppercase label style); `pacts/spec.md` PACT-06 AC1, the assumption row and the Independent Test now say so (list card keeps "X de N hoje") and the detail test asserts "Hoje" (commit 5f55cb5)
- **Stories (2026-10-07)**: T1-T10 done in code (`.specs/features/stories/tasks.md`), STORY-01..07 marked Implemented in `spec.md`, assumptions confirmed. Feed (`StoriesView`, Figma 08) with the "Você já compartilhou hoje" notice, end marker "você chegou ao fim" as the FlatList footer only when there are stories, dates as "hoje", "ontem" or DD/MM; composer (`StoryComposerScreen`, Figma 14) with "N de 280"; reaction chips "Estou com você" / "Me inspirou" and "Recebeu: ..." for the author, no counts. Wired: `SupabaseStoryRepository` in `app/_layout.tsx`, stories tab in `app/(app)/circles/[id]/index.tsx`, "Novo relato" header action, route `app/(app)/circles/[id]/stories/new.tsx` (restart Metro with `--clear`). 509 tests green (73 in stories), typecheck and lint clean. Verifier PASS (`.specs/features/stories/validation.md`, 35/35 mutants killed); the manual check on the real backend started: the feed loads and the user confirmed it works (post, second post, reactions with two accounts still to be re-confirmed by the user)
- **Stories Figma alignment (2026-10-07)**: T11-T12 done (STORY-08). Frame 17 (`22:601`): feed starts with the "O que você fez offline hoje?" card (brand border, "Escrever relato") until the member posts, then the "Você já compartilhou hoje" notice; end marker ring 32. Frame 19 (`24:704`): empty state body "Seja o primeiro a contar o que fez fora da tela hoje." plus "Escrever relato", no end marker. "Novo relato" header action removed (pacts keeps "Novo pacto"). Frame 18 (`24:616`): pacts empty body changed to "Combinem algo que o círculo todo consiga cumprir, todo dia.". 512 tests green (76 in stories), typecheck and lint clean. Not re-verified by a Verifier
- **Stories hardening (2026-10-07)**: migration `supabase/migrations/0004_stories_hardening.sql` applied to RODA on 2026-10-08 (policies and the validated body check confirmed in pg_policies and pg_constraint); it addresses validation gaps 1-3 (reaction UPDATE policy with the insert predicates, `day` bounded to current_date +-1 in `stories_insert_member`, trim-aware `stories_body_check`); the feed also filters `day <= today`
- **Stories bug found only on the real backend**: the embed `profiles(display_name)` returned HTTP 300 (PostgREST ambiguity, profiles is reachable through `author_id` and through `story_reactions`), so the feed showed the error banner. Fixed with the FK hint `profiles!stories_author_id_fkey(display_name)` (commit ea78b6e) and a regression test on the select string
- **README**: `README.md` written (commit f57cb00); says meetups are not implemented. Corrected in f3f328a: migration 0004 in the setup list, the author sees reaction kinds (not who reacted), the "Em breve" Encontros tab, and the one-story-per-day demo step
- **Polish (2026-10-07)**: reaction-bar pending guard done (stories T13, validation gap 6, commit 71c276d; gaps 4, 5 and 7 stay open as minor). Shared `EmptyState` aligned to the Figma component `3:120`: ring 140, gap 16, vertical padding 32, no side padding, h2 title and body centered (commit 3518819, new `src/shared/ui/__tests__/empty-state.test.tsx`); the Figma ring has slightly different dot geometry (orbit 64, dot r 6 on 140) than the shared `Ring`, left as is. Final checks: no hex literals outside `src/core/theme`, no TODO or console calls in `src` and `app`. 519 tests green (59 suites), typecheck and lint clean
- **Onboarding (2026-10-07)**: done in code, T1-T10 (`.specs/features/onboarding/tasks.md`), ONB-01..05 in `spec.md`; Verifier NOT run yet and manual check pending. Splash (Figma 21) replaces the `ActivityIndicator` on every launch and stays at least 1200 ms (`SPLASH_MINIMUM_MS`, `LaunchNavigator minSplashMs` prop, tests pass 0) and until the flag is read; three onboarding pages (Figma 22-24) only for a signed-out user on a fresh device; "Pular"/"Começar" -> Criar conta, "Já tenho conta" -> Entrar, each exit stores `roda.onboarding.seen` = "true" in AsyncStorage (localStorage on web); read failure counts as seen, write failure is ignored; a sign-in on a device with the flag unset also stores it, so signing out never shows onboarding. Composition recorded as AD-008 (`LaunchNavigator` in onboarding composes the auth `RootNavigator`, which now takes `splash`, `holdSplash`, `showOnboarding` props). New route `app/(auth)/onboarding.tsx`: restart Metro with `npx expo start --web --clear`. New token `typography.sizes.wordmark` (64); no new color role. 576 tests green (67 suites), typecheck and lint clean
- **Onboarding Verifier fixes (2026-10-07)**: Verifier iteration 1 was FAIL (`.specs/features/onboarding/validation.md`, gaps 1-5); T11-T15 done in `tasks.md` Phase 5, re-verification (iteration 2 of 3) pending. T11 asserts the splash colors (`inverse` background, `onInverse` wordmark, `onInverseSecondary` tagline; M24/M25 now killed). T12 corrects the exit-order comment (the order of `onExit` and `markSeen` is not observable under React batching). T13 makes the illustrations inert (style `pointerEvents: 'none'`, sample chips drawn as plain views; shared `Chip` unchanged). T14 route test: a rejected `markSeen` still lands on `/register`. T15 adds ONB-03 AC9-10: Android system back on page 2 or 3 shows the previous page (`BackHandler`), on page 1 it is not handled and the app is left; on web the browser back is not intercepted (spec assumption). 584 tests green (67 suites), typecheck and lint clean
- **Onboarding manual check (pending, user)**: fresh browser profile signed out -> splash then onboarding 1-3 -> Criar conta; reload -> splash then Entrar; signed in -> splash then Círculos. The running dev server on 8081 was not restarted by the agent, so the flow was not seen in a browser
- **Pending Figma for meetups**: frame 20 (`24:798`, empty meetups with "Propor encontro") and frame 15 (propose meetup) apply when meetups is built
- **Phase / Task**: circles, pacts and stories closed (migration 0004 applied); onboarding T1-T15 done in code, pending Verifier re-run (iteration 2) and manual check
- **Completed**: foundation T1-T22; auth T1-T24 (verified, manually tested by the user); circles T1-T12 plus Figma alignment (empty state, join, new circle, members ring) and fix for pasted invite codes with spaces; fonts Fraunces and DM Sans now load in `app/_layout.tsx` (added `expo-asset`); `ring.tsx`/`icon.tsx` no longer pass `accessible` to Svg; `0001`, `0002` and (later) `0003`, `0004` migrations applied to RODA (`fsckgwcwweblvyyywvis`), 323 tests green
- **Manually verified on the real backend (user, web)**: empty state, name validation, create circle (lands on Membros with the code), unknown code, joining own circle, list with one circle, join with a second account, several accounts in one circle, and the 13th member is rejected with "Este círculo está cheio". Circles manual check is complete
- **Lessons**: (0) An embed between two tables with more than one FK path needs an FK hint (`table!fk_name(...)`); the in-memory tests cannot see it, so check every new Supabase query on the real backend. (1) Metro caches the route map; after adding route files restart with `npx expo start --web --clear`, otherwise `Stack.Protected` does not cover new groups and sign-out does not redirect. (2) Supabase Data API must stay enabled with `public` in Exposed schemas, otherwise every REST call returns 503 PGRST002 (log: `pg_pgrst_no_exposed_schemas`)
- **Test data**: circle "ATeste Roda" (code J8FW57) exists on the remote project; the user deletes it and prepares two demo accounts before the demo
- **Remaining features**: meetups, left for the user to continue (Figma frames 15 propose meetup and 20 `24:798` empty meetups; the Encontros tab keeps the "Em breve" placeholder); demo
- **Python**: the skill's validators run as `python` (3.14 at `C:\Python314`); only the `python3` alias is broken
- **Next step**: re-run the onboarding Verifier (iteration 2, `.specs/features/onboarding/validation.md`) and the manual check above (also try Android back on pages 2-3 and Tab on page 3 in the browser); demo data (user deletes "ATeste Roda" J8FW57 and prepares two accounts), rehearse the README demo script; meetups only if the user continues it
- **Blockers**: none; the in-app browser session got signed out after a reload, sign in again to resume manual checks
- **Uncommitted files**: none (`.claude/launch.json` is ignored by `.gitignore`)
- **Branch**: main; the onboarding commits (9a8fcda..T15) are local and were not pushed by the agent (push authorized by CLAUDE.md when the user decides)
