# ADR-004: `main` is the primary/production branch again

## Status

Accepted (2026-11-06). Supersedes [ADR-003](003-retire-main-dev-is-primary.md).

## Context

ADR-003 retired `main` while there was no deployed environment. In November 2026 the app went live on Render through the [render.yaml](../../render.yaml) Blueprint, which deploys from `main`. The redesign branch was merged into `main`, and `main` moved ahead of `dev`.

## Decision

`main` is the primary/production branch. Every change is a short-lived branch off `main` (`feat/*`, `fix/*`, `chore/*`, `docs/*`) merged back through its own PR (squash merge, human-merged). No direct pushes to `main`. PRs are not stacked on other open PRs. After each merge a release workflow bumps the semver `VERSION`, tags it and triggers the Render deploy.

## Consequences

- CI workflows trigger on PRs into `main`; `dev` is legacy and receives no new work.
- Branch rules/rulesets on GitHub should protect `main` (today only a `dev` ruleset exists).
- Living docs (CLAUDE.md, README.md) describe this workflow; ADR-003 and older docs stay as historical records.
