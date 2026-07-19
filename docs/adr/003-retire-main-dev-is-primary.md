# ADR-003: Retire `main`; `dev` is the primary/production branch

## Status

Accepted (2026-07-07). Supersedes the `feature/* → dev → main` workflow described in [meeting-summary.md](../meeting-summary.md) and [architecture-decisions.md](../architecture-decisions.md).

## Context

The original GitHub setup (per the Kickoff meeting) used two protected branches: `dev` (integration/testing) and `main` (production), with a two-step promotion (`feature/* → dev`, then `dev → main`). The team simplified this and deleted `main` — for a project at this stage (pre-MVP, no live production deployment yet, small team), a second promotion step and a second protected branch added process overhead without a corresponding benefit.

## Decision

`main` no longer exists. **`dev` is now the primary/production branch.** The workflow is a single step: branch off `dev` (`feature/*`, `fix/*`, `chore/*`, `docs/*`), PR back into `dev` with 1 approval, merge. No direct pushes to `dev`.

If the team later needs a separate release/production branch again (e.g. once there's a real deployed environment that must stay stable independent of `dev`), reintroduce it as a new ADR rather than reviving this one.

## Consequences

- CI workflows (`backend-ci.yml`, `frontend-ci.yml`, `copilot-review.yml`) trigger on PRs into `dev` only.
- Repository branch protection/rulesets should be reconfigured on GitHub to protect only `dev` (the `main`-specific rule, e.g. 2 approvals, no longer applies since `main` is gone).
- Historical docs ([meeting-summary.md](../meeting-summary.md)) that describe the original `dev → main` workflow are left as a record of what was actually decided at the time and are not rewritten; they carry a note pointing here.
- Living docs (CLAUDE.md, README.md, DEV_SETUP_PLAN.md, architecture-decisions.md, skeleton-implementation.md) are updated to describe the current single-branch workflow.
