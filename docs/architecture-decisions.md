# ESN App — Architecture Decisions

These extend the stack agreed on in the [meeting summary](meeting-summary.md) with the structural choices needed to generate a team-ready skeleton. Made 2026-07-07.

## Repo layout: monorepo

Single repo (`github.com/ESN-App/ESN-App`), top-level split by concern:

```
ESN-App/
├── backend/            # .NET solution (Clean Architecture)
├── frontend/            # Angular workspace
├── docker/               # Dockerfiles, compose, env templates
├── docs/                 # architecture notes, ADRs, runbooks
├── .github/workflows/    # CI
└── docker-compose.yml
```

Rationale: they already have one repo, one set of branch rulesets, and one PR workflow (`feature/*` → `dev` → `main`). Splitting into multiple repos would mean coordinating versions and PRs across repos for no real benefit at this size.

## Backend: Clean Architecture

Four projects, dependencies point inward:

```
backend/
├── EsnApp.Domain            # Entities, enums, value objects, domain interfaces. No dependencies.
├── EsnApp.Application        # Use cases, DTOs, service interfaces, validation. Depends on Domain only.
├── EsnApp.Infrastructure       # EF Core, PostgreSQL, Identity/JWT, external services. Implements Application interfaces.
├── EsnApp.Api                # Controllers, Swagger, DI wiring, middleware. Depends on Application + Infrastructure.
└── EsnApp.sln
```

Within `Domain` and `Application`, code is grouped by MVP module (`Events`, `Discounts`, `Info`, plus `Identity`/`Users` for auth) so each can be owned independently:

```
Application/
├── Events/
├── Discounts/
├── Info/
└── Common/           # shared behaviors, pagination, result wrappers
```

Rationale: clear dependency boundaries prevent one module's code from silently depending on another's internals, and the module subfolders let each team member work in their own folder with minimal merge conflicts. This is more structure than a 3-project layout needs to carry for an MVP, but it pays off the moment 3+ people touch the backend at once — which is the stated goal here.

## Frontend: Angular + Angular Material, feature modules

```
frontend/src/app/
├── core/               # singleton services, interceptors, guards
├── shared/            # shared components, pipes, directives
├── features/
│   ├── events/
│   ├── discounts/
│   ├── info/
│   └── auth/
└── app.routes.ts       # lazy-loaded feature routes
```

Angular Material for UI components (forms, lists, cards, dialogs) — official, accessible, and fast to assemble standard CRUD-style screens without hand-rolling CSS. PWA support enabled via `@angular/pwa` (service worker, manifest, icons) per the Kickoff decision.

Each feature folder is a self-contained Angular module with its own routing, components, and services — same rationale as the backend: independent, low-conflict ownership per person/module.

## Auth: scaffolded, not fleshed out

ASP.NET Core Identity + JWT bearer auth, wired end-to-end but with no real business rules yet (one seeded admin role, empty `[Authorize]` usage as an example). Discounts and Events will need staff-only management screens eventually (create/edit events, assign discounts to partners); adding the scaffold now avoids retrofitting auth through every controller later. Public read endpoints (browsing events/discounts/info) stay anonymous.

## Containers: Docker Compose

Services: `postgres`, `backend` (.NET API), `frontend` (Angular, served via Nginx in prod mode or `ng serve` in a dev override), plus a `docker-compose.override.yml` for local dev (hot reload, exposed ports, pgAdmin optional). One `.env.example` at the repo root for connection strings/secrets, nothing real committed.

## CI

GitHub Actions workflow(s) triggered on PRs into `dev` and `main`, matching the existing ruleset (PR + 1 approval required to merge): restore/build/test the backend, install/build/lint the frontend. Keeps the pipeline honest with the branch protection already configured, without adding a deploy step yet (Deployment doc in Notion is still empty/To-do).

## Explicitly out of scope for the skeleton

No business logic, no real domain entities beyond minimal placeholders, no actual UI screens beyond a routed "hello" page per feature, no deployment/hosting setup. Purpose is a scaffold the team can immediately split up and build on top of.
