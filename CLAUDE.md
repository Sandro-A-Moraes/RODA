# Roda

Mobile app (Expo + TypeScript + Supabase) for a university project. Delivery deadline: 2026-10-08.

## Where we are
Read these in order at the start of every session:
1. `.specs/STATE.md` - Decisions (AD-NNN, binding) and the Handoff (current state and next step).
2. `.specs/ROADMAP.md` - feature order, cut line, schedule.
3. `docs/PROJECT_CONTEXT.md` and `docs/DESIGN_SYSTEM.md` - product, architecture, colors.

Then reconcile the Handoff with `git status` and `git log` before acting.

## How we work
- Use the `tlc-spec-driven` skill: Specify -> Design -> Tasks -> Execute, specs in `.specs/features/<feature>/`.
- Tests first, one atomic Conventional Commit per task, Verifier at the end of each feature. Push to `origin/main` after commits is authorized.
- Code, identifiers and commits in English; all user-facing text in Brazilian Portuguese.
- Never hardcode hex colors (use `src/core/theme` roles). Never commit `.env`.
- Update the Handoff in `.specs/STATE.md` when pausing or finishing a feature.
