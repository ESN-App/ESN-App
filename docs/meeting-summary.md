# ESN App — Meeting Summary

Source: Notion → ESN APP → Project Documentation → Meetings (Init, 2026-06-29; Kickoff, 2026-07-03), and the ESN APP page's GitHub setup notes.

## Init meeting (2026-06-29)

**Goal:** scope the MVP, pick an initial tech stack, set architecture direction.

Decisions:
- Backend: **.NET Web API**, API docs via **Swagger**.
- Database: **PostgreSQL**.
- Repo: **GitHub Organization**, tasks tracked via **GitHub Projects**.
- Branching: `main` (production), `dev`, `feature/*`.
- MVP modules: **Events**, **Discounts**, **General Info**. Map = *Could Have*, deferred post-MVP.
- Project docs live in **Notion**.

Open at the time (resolved in Kickoff): frontend framework, mobile platform choice.

## Kickoff meeting (2026-07-03)

**Goal:** finalize remaining tech choices, set up team tooling.

Decisions:
- Frontend: **Angular**.
- Platform: **PWA** (Progressive Web App) — no separate native mobile app.
- Containerization: **Docker Compose**.
- Tooling: **Discord** (comms/notifications), **Notion** (docs/knowledge base), **GitHub** (source, PRs, tasks).

Next steps (from the meeting): reach out to ESN, prepare the initial project structure (backend, frontend, database, Docker Compose config) in the GitHub repo, add all team members to Discord / GitHub Org / Notion.

## GitHub setup already in place

Repo: `github.com/ESN-App/ESN-App` (public — required for rulesets to work on the free org plan).

Branch strategy:
- `feature/*` — new work (e.g. `feature/login`)
- `dev` — integration/testing
- `main` — production

Ruleset: no direct pushes to `main` or `dev`; changes require a Pull Request with at least one approval.

Workflow:
1. Pull `dev`
2. Branch off `dev` (`feature/*`, `bug/*`, …)
3. Commit, push to the feature branch
4. PR into `dev`
5. One approval required
6. Merge into `dev`, test
7. PR from `dev` into `main`
8. Merge into `main`

Discord webhooks configured for: push, pull request, issues. GitHub Projects Kanban board is set up for task tracking.

## Product scope (Project Overview)

Goal: one app for ESN Gdańsk to support incoming Erasmus students — events, discounts, and practical info about their stay, in one place. Target: first version live before the next academic semester; treated as a production release used to collect feedback and iterate. Long-term, it may become a template for other ESN sections.

MVP scope:
- **Events** — schedule, list, event details
- **Discounts** — list of discounts, assigned to partners/locations
- **Info** — about ESN, general info about Gdańsk, contact details

Post-MVP (Could Have): a **Map** module (event locations, partners/discounts, info points, recommended places).

## Net tech stack (confirmed)

| Layer | Choice |
|---|---|
| Frontend | Angular (PWA) |
| Backend | .NET Web API |
| Database | PostgreSQL |
| API docs | Swagger / OpenAPI |
| Containers | Docker Compose |
| Source control | GitHub (Org: ESN-App) |
| Task tracking | GitHub Projects (Kanban) |
| Docs | Notion |
| Comms | Discord |
