# Auth Specification

## Problem Statement

Every Roda feature is scoped to a person inside a circle, so the app needs identity first. Users must register, sign in, sign out and stay signed in across restarts, and unauthenticated users must never reach circle content.

## Goals

- [ ] A new user can register, land in the app, sign out and sign back in.
- [ ] Protected routes are unreachable without a session.
- [ ] Every failure shows a pt-BR message and never a raw backend error.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Password reset / e-mail confirmation | Confirm email is disabled for the demo; no course requirement |
| Social login (Google, Apple) | Needs native config that conflicts with Expo Go |
| Profile editing and avatars | Not required; "no public profiles" anti-feature (AD-005) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Sign-up fields | display name, e-mail, password | A circle needs a human-readable member name | y |
| Display name bounds | 2 to 40 characters after trim | Fits a member list row without truncation | y |
| Password rule | minimum 8 characters | Supabase default is 6; 8 is the common baseline and is cheap to test | y |
| E-mail format check | Zod `email()` | Standard, no custom regex to maintain | y |
| Session storage | Supabase client with AsyncStorage | Required for persistence in Expo | y |
| Profile row | `profiles` row created on sign-up carrying the display name | Memberships need a name to show | y |
| Supabase "Confirm email" | Disabled by the user in the dashboard | Plan requirement for the demo | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Register ⭐ MVP

**User Story**: As a new user, I want to create an account so that I can join or create a circle.

**Why P1**: Nothing else is reachable without an account.

**Acceptance Criteria**:

1. WHEN a user submits a valid display name, e-mail and password THEN the system SHALL create the account, start a session and navigate to the app's main area.
2. IF the e-mail is not a valid address THEN the system SHALL show "E-mail inválido" on the e-mail field and not call the repository.
3. IF the password has fewer than 8 characters THEN the system SHALL show "A senha deve ter pelo menos 8 caracteres" on the password field and not call the repository.
4. IF the display name is shorter than 2 or longer than 40 characters after trimming THEN the system SHALL show "Nome deve ter entre 2 e 40 caracteres" on the name field.
5. IF the e-mail is already registered THEN the system SHALL show "Este e-mail já está cadastrado" in an error banner.
6. WHILE the registration request is pending the submit button SHALL be in loading state and ignore further presses.

**Independent Test**: Fill the form on web, submit, land on the main area; repeat with the same e-mail and see the banner.

---

### P1: Sign in and out ⭐ MVP

**User Story**: As a returning user, I want to sign in and out so that my circles stay private to me.

**Why P1**: Required for any repeat use and for the demo.

**Acceptance Criteria**:

1. WHEN a user submits a registered e-mail and the correct password THEN the system SHALL start a session and navigate to the main area.
2. IF the credentials do not match THEN the system SHALL show "E-mail ou senha incorretos" in an error banner.
3. IF the e-mail or password field is empty THEN the system SHALL show a field-level "Campo obrigatório" message and not call the repository.
4. IF the device has no connectivity THEN the system SHALL show the `network` error message from Foundation with a "Tentar novamente" action.
5. WHEN a signed-in user taps "Sair" THEN the system SHALL end the session and navigate to the sign-in screen.
6. The system SHALL NOT display raw backend error text to the user.

**Independent Test**: Sign in with good and bad passwords; sign out and confirm return to sign-in.

---

### P1: Session restore and route protection ⭐ MVP

**User Story**: As a user, I want to stay signed in and be kept out of private screens when signed out.

**Why P1**: Required by RLS-backed screens and by a sane reopen experience.

**Acceptance Criteria**:

1. WHEN the app starts with a valid stored session THEN the system SHALL go straight to the main area without showing the sign-in screen.
2. WHEN the app starts with no stored session THEN the system SHALL show the sign-in screen.
3. WHILE the session is being restored the system SHALL show a loading indicator and no protected content.
4. IF a signed-out user navigates to a protected route THEN the system SHALL redirect to the sign-in screen.
5. IF a signed-in user navigates to the sign-in or register route THEN the system SHALL redirect to the main area.
6. IF the stored session is expired or invalid THEN the system SHALL clear it and show the sign-in screen.

**Independent Test**: Sign in, reload the web app, stay in; sign out, open a protected URL, get redirected.

---

## Edge Cases

- IF the sign-in form is submitted twice quickly THEN the system SHALL issue only one repository call.
- IF the display name contains only whitespace THEN the system SHALL treat it as shorter than 2 characters.
- IF the e-mail has leading or trailing whitespace or uppercase letters THEN the system SHALL trim and lowercase it before submitting.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTH-01 | P1: Register (AC 1, 6) | Execute | Done (manual Supabase check pending) |
| AUTH-02 | P1: Register (AC 2-4) | Execute | Done |
| AUTH-03 | P1: Register (AC 5) | Execute | Done (manual Supabase check pending) |
| AUTH-04 | P1: Sign in and out (AC 1, 5) | Execute | Done (manual Supabase check pending) |
| AUTH-05 | P1: Sign in and out (AC 2-3) | Execute | Done (manual Supabase check pending) |
| AUTH-06 | P1: Sign in and out (AC 4, 6) | Execute | Done (manual Supabase check pending) |
| AUTH-07 | P1: Session restore (AC 1-3, 6) | Execute | Done (manual Supabase check pending) |
| AUTH-08 | P1: Session restore (AC 4-5) | Execute | Done (manual Supabase check pending) |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Register, sign out, sign in and reload flow works end to end on web against the real Supabase project.
- [ ] No test or screen exposes a raw Supabase error string.
