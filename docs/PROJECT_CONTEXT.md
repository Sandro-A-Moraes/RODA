# Roda — Project Context (for LLMs)

This document gives an LLM the full context needed to work on this repository. Read it before writing any code. For the execution plan and phase breakdown see `docs/PLANO.md` (written in Portuguese).

## 1. What this project is

**Roda** is a mobile social app that uses small-group social dynamics to help people reduce compulsive social-media use. The name means "wheel" or "circle" in Portuguese, and it refers to the core concept: a closed circle of people who know each other.

It is a university final project (Mobile Programming course, UEPA, Brazil), built by a student team. **The delivery deadline is 2026-10-08**, with a live presentation. Development started 2026-10-05, so the schedule is tight and scope discipline matters.

All user-facing text in the app is in **Brazilian Portuguese (pt-BR)**. Code, identifiers, comments, commit messages and technical docs are in **English**, except `docs/PLANO.md`, which is in Portuguese.

## 2. Academic requirements (from the assignment: "Unidade VI — Projeto Integrador")

The assignment asks teams to build a complete mobile app that solves a real problem. The minimum requirements are:

- Mobile interface
- Three or more screens
- Navigation
- A form
- Validation
- Consumption of an API / Web Service
- Display of data
- At least one CRUD feature
- Basic error handling

Stages: planning, prototype, development, API integration, testing, presentation. The presentation must cover: the chosen problem, the proposed solution, the technologies used, the main features, and the API integration.

Suggested themes in the assignment include sustainability, events, and task control. The team chose a digital-wellbeing theme (a healthy social network / digital detox with community).

**Every design decision must keep these requirements satisfied.** If a change would break one of them, flag it.

## 3. The problem being solved

Mainstream social networks optimize for engagement: infinite scroll, variable rewards (likes), social comparison and fear of missing out. The result is compulsive use, anxiety and loneliness. They promise connection and deliver the opposite.

People who try to disconnect alone usually fail for three reasons:

1. **No external commitment.** Purely personal goals are easy to break. Commitments made to other people work much better ("commitment device").
2. **No substitute.** Quitting leaves a social void. If nothing fills it, the person returns.
3. **Isolation.** Disconnecting costs contact with the group and creates social pressure to return.

## 4. The solution: social dynamics as the mechanism

Roda uses social mechanics against the addiction instead of fighting them. The app pushes people toward real life.

### Core concepts (domain language)

| Concept | Meaning |
|---|---|
| **Circle** | A closed group of at most **12 people** who already know each other (friends, class, family). No public profiles, no followers. Joined through an invite code. The limit is inspired by the cap on close relationships we can maintain (Dunbar's number). |
| **Pact** | A collective commitment of a circle, e.g. "no phones during meals" or "2h of focus per day". Members check in individually and the circle sees **collective progress, not an individual ranking**. Mutual accountability is the engine of the app. |
| **Check-in** | A member's daily confirmation of a pact. At most one per member per pact per day. |
| **Story** (*relato*) | One short reflection per day ("what did I do offline today?"). No like counter. |
| **Reaction** | Qualitative responses to a story, such as "I'm with you" or "this inspired me". Never a numeric popularity metric. |
| **Meetup** (*encontro*) | An in-person activity proposed by the circle, with RSVPs. This closes the loop: the app sends people outside. |
| **Support request** | A "I need support" button that alerts the circle when the urge to go back to scrolling hits. (Stretch goal.) |

### Deliberate anti-features (never add these)

- Infinite scroll. The feed is chronological and finite, and ends with "você chegou ao fim" ("you reached the end").
- Visible like counters or any popularity metric.
- Followers or public profiles.
- Algorithmic feed ranking.
- Engagement-bait notifications.

These are product decisions, not omissions. Do not "improve" the app by adding them.

### Typical user journey

Join a circle → accept a pact → daily check-in → write a daily story → go to an in-person meetup. Support requests are available at any point.

## 5. Scope and priorities

- **Must have (core):** auth, circles, pacts with check-ins (the main CRUD), stories.
- **Should have:** meetups.
- **Stretch:** support request button, focus sessions.
- **Out of scope:** real device screen-time measurement. It requires native code and is not available in **Expo Go**. Focus sessions would only measure time registered inside the app. Content moderation is also out of scope; closed groups of acquaintances reduce the risk.

If time runs out, cut meetups and the support button first. Phases 0 to 4 in `docs/PLANO.md` already cover every course requirement.

## 6. Tech stack

| Concern | Choice |
|---|---|
| Framework | React Native with **Expo** (must run in **Expo Go**) |
| Language | TypeScript, strict mode |
| Navigation | Expo Router (tabs and stacks) |
| Backend | **Supabase** (Auth + Postgres + auto-generated REST via PostgREST), with Row Level Security. No custom server code. |
| Server state | TanStack Query |
| Forms and validation | react-hook-form + Zod (schemas live in the `domain` layer) |
| Tests | Jest (`jest-expo`) + React Native Testing Library |
| Lint / format | ESLint + Prettier |

The Expo Go constraint means: no custom native modules, no development builds. Stay within the Expo SDK's managed libraries.

## 7. Architecture

**Modular by feature**, following **clean architecture**.

```
app/                      # Expo Router routes. Thin: they only render screens from modules.
src/
  core/                   # theme tokens, AppError/Result, Supabase client, DI provider, navigation helpers
  shared/
    ui/                   # reusable components, promoted here only when a 2nd module needs them
  modules/
    auth/
    circles/
    pacts/
    stories/
    meetups/
      domain/             # entities, repository interfaces, use cases, Zod schemas. Pure TypeScript.
      data/               # Supabase repository, in-memory repository, mappers, error translation
      presentation/       # screens, components, hooks, providers
      __tests__/
      index.ts            # the ONLY public entry point of the module
supabase/
  migrations/             # SQL for tables and RLS policies, applied manually in the Supabase dashboard
docs/
```

### Dependency rules

- Dependencies point inward: `presentation → domain ← data`.
- `domain` is plain TypeScript. **It must not import React, React Native, Expo or Supabase.**
- A module **never imports another module's internal folders**, only its `index.ts`. ESLint enforces this.
- Each module defines repository **interfaces** in `domain`. Two implementations exist: `InMemory` (tests and early development) and `Supabase` (production). They are wired through dependency injection.
- Use cases are small functions or classes that depend on repository interfaces.

## 8. Engineering rules

### Process: TDD

1. Write the tests first and confirm they fail for the right reason.
2. Write the minimum code to pass, then refactor.
3. Run `npm test`, `npm run typecheck` and `npm run lint`.
4. Make **one commit per step** using Conventional Commits, for example `feat(auth): add login with validation`.

The work advances by small steps. After each step the user reviews the result and approves before the next one starts.

### Test layers

| Layer | Tests |
|---|---|
| `domain` | Use cases and validation, against the in-memory repository |
| `data` | Mappers (database row → entity) and error translation |
| `presentation` | Screen behavior with React Native Testing Library: fill in, submit, see error or success |

The real Supabase backend is not covered by automated tests. The user validates it manually.

### Components and state

- **Create a component only when needed:** it is used in 2 or more places, or it has a clear single responsibility and more than about 80 lines.
- A component starts inside its module. It moves to `shared/ui` only when a second module needs it.
- **Avoid prop drilling.** The limit is 2 levels. Beyond that, use a module hook, a Context, or composition (`children`).
- Server state goes through TanStack Query. Global client state is limited to the session and dependency injection, through Context. **No Redux.**

### React Native best practices

- `FlatList` for lists; `useCallback` and `memo` only where there is a measurable gain.
- `SafeAreaView` and `KeyboardAvoidingView` where relevant.
- Accessibility: `accessibilityLabel`, touch targets of at least 44px.
- Every screen that shows data handles **loading, empty and error** states.
- Errors are modeled with `AppError` and `Result`; infrastructure errors are translated into domain errors at the `data` boundary and never leak raw to the UI.

### Definition of done for a step

- Tests were written first and pass.
- `typecheck` and `lint` are clean.
- Loading, error and empty states are handled where data is displayed.
- The commit is made and a summary is given to the user (what was done, tests added, how to verify, commit hash).

## 9. Data model (Supabase / Postgres)

Everything revolves around the circle. Tables, by feature:

- **People:** `profiles`, `memberships` (links a profile to a circle)
- **Circles:** `circles` (with invite code and a 12-member cap)
- **Pacts:** `pacts`, `check_ins`
- **Stories:** `stories`, `reactions`
- **Meetups:** `meetups`, `rsvps`

**Row Level Security is mandatory on every table:** a person can only read and write data belonging to circles they are a member of. Each phase that needs tables ships a SQL migration under `supabase/migrations/`, which the user applies in the Supabase SQL editor.

Secrets (Supabase URL and anon key) live in `.env` and are never committed.

## 10. Visual identity

Used in the presentation deck and to be reflected in the app theme.

- **Mood:** warm, human, calm. The opposite of a neon, addictive feed.
- **Palette:** deep forest green (`#10261F`), cream (`#F5EEDF`) as the main light color, sand, a terracotta/orange accent, and a soft sage green. The official values, roles and approved contrast pairs are in `docs/DESIGN_SYSTEM.md`.
- **Typography:** Fraunces (serif, for headings) and DM Sans (body).
- **Motif:** the circle. A ring with 12 dots around it represents a circle of 12 people.

Design tokens belong in `src/core/theme`. Do not hardcode colors or spacing in components.

## 11. Working agreements for an LLM in this repo

- **Respect the anti-features** in section 4 and the **scope cuts** in section 5.
- **Prefer small, reviewable steps.** One step, one commit, then wait for the user's approval.
- **Do not add dependencies or abstractions without a clear need.** The deadline is short.
- **Do not store secrets in the repo.**
- **Ask before** changing the architecture rules, the stack, or the product decisions above. If a requirement from section 2 would be broken, say so explicitly.
- Keep user-facing strings in Brazilian Portuguese and everything else in English.
- The user cannot rely on a physical phone for testing, so verification may happen on the web (`expo start --web`) or on an Android emulator. Prefer solutions that work on all of them.
