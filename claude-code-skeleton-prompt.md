# Prompt for Claude Code — ESN App skeleton

Paste everything below the line into Claude Code, run from an empty (or freshly cloned) `ESN-App` repo root.

---

Scaffold a production-grade **skeleton** for a monorepo web app. This is a foundation for a team of several developers to split work on and merge independently — **do not implement any business logic, real domain rules, or real UI screens.** Every module should be wired end-to-end (routing, DI, DB, build) but functionally a no-op / placeholder. Prioritize a structure that lets multiple people work in parallel with minimal merge conflicts.

## Stack

- Backend: **.NET 8 Web API** (C#), Clean Architecture, EF Core + Npgsql, Swagger/OpenAPI, ASP.NET Core Identity + JWT bearer auth.
- Database: **PostgreSQL**.
- Frontend: **Angular** (latest stable), standalone components, **Angular Material**, configured as a **PWA** (`@angular/pwa`: manifest + service worker).
- Containers: **Docker Compose** (postgres, backend, frontend), plus a dev override for hot reload.
- CI: **GitHub Actions**, triggered on PRs into `dev` and `main` (build + test backend, install + build + lint frontend). No deploy step yet.
- Repo: monorepo, single GitHub repo.

## Repo layout

```
.
├── backend/
│   ├── src/
│   │   ├── EsnApp.Domain/
│   │   ├── EsnApp.Application/
│   │   ├── EsnApp.Infrastructure/
│   │   └── EsnApp.Api/
│   ├── tests/
│   │   ├── EsnApp.Application.Tests/
│   │   └── EsnApp.Api.Tests/
│   └── EsnApp.sln
├── frontend/
│   └── (standard Angular workspace, project name "esn-app")
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── postgres/ (init scripts if needed)
├── docs/                      # already has meeting-summary.md, architecture-decisions.md — don't overwrite
├── .github/workflows/
│   ├── backend-ci.yml
│   └── frontend-ci.yml
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── .editorconfig
├── .gitignore
└── README.md
```

## Backend — Clean Architecture

**EsnApp.Domain** — no project references. Contains:
- Base entity class (`Id`, `CreatedAt`, `UpdatedAt`).
- Placeholder entities for each module: `Event`, `Discount`, `Partner`, `InfoArticle` — minimal properties only (Id, Name/Title, a couple of obvious scalar fields), no relationships beyond a simple FK where it's obvious (e.g. `Discount.PartnerId`).
- Folder per module: `Events/`, `Discounts/`, `Info/`.

**EsnApp.Application** — references Domain only. Contains:
- Folder per module (`Events/`, `Discounts/`, `Info/`, `Identity/`), each with: a DTO or two, an interface for a repository/service, and one example CQRS-style use case (pick either MediatR or plain service classes — MediatR preferred if you're comfortable adding the dependency) that just returns placeholder/empty data.
- `Common/` folder: pagination wrapper, a generic `Result<T>` type, validation behavior pipeline (FluentValidation is fine if added).
- DI extension method `AddApplication(this IServiceCollection services)`.

**EsnApp.Infrastructure** — references Application + Domain. Contains:
- `AppDbContext` (EF Core, Npgsql) with `DbSet<T>` for each entity, one initial migration.
- Repository implementations satisfying Application interfaces (simple EF Core CRUD, no business rules).
- ASP.NET Core Identity setup (`ApplicationUser` extending `IdentityUser`), JWT token generation service.
- DI extension method `AddInfrastructure(this IServiceCollection services, IConfiguration configuration)`.

**EsnApp.Api** — references Application + Infrastructure. Contains:
- One controller per module (`EventsController`, `DiscountsController`, `PartnersController`, `InfoController`), each with placeholder `GET` (list/detail) and `POST` endpoints calling into Application — no real behavior needed, returning seeded/empty data is fine.
- `AuthController` with register/login wired to Identity + JWT, functional (this is the one piece that should actually work, since every other module depends on it existing).
- Swagger/OpenAPI enabled with JWT bearer support in the Swagger UI.
- Global exception handling middleware, CORS configured for the Angular dev server origin, `appsettings.json` / `appsettings.Development.json` with a connection string placeholder read from environment variables.
- Health check endpoint (`/health`).

**Tests** — one trivial passing test per test project (e.g. a controller returns 200, a use case returns the expected placeholder shape) so CI has something real to run, not just "no tests found."

## Frontend — Angular

- Standalone components, Angular Material installed and themed (any reasonable default theme/typography — this can be changed later), Angular PWA schematics run (`ng add @angular/pwa`).
- `core/`: `AuthService` (calls the real `/auth` endpoints), an HTTP interceptor attaching the JWT, an auth guard.
- `shared/`: one example shared component (e.g. a loading spinner or empty-state component) and a barrel export.
- `features/events/`, `features/discounts/`, `features/info/`, `features/auth/`: each a lazy-loaded route with one placeholder "list" component making a real HTTP call to its backend controller and rendering whatever comes back (even if empty), plus its own routing file.
- Root `app.routes.ts` wiring the lazy feature routes.
- Environment files (`environment.ts` / `environment.development.ts`) with the API base URL.
- A minimal login/register page under `features/auth` that actually calls the backend auth endpoints and stores the token (so the auth flow is provably working end to end).

## Docker

- `docker/backend.Dockerfile`: multi-stage build (SDK → runtime) for the .NET API.
- `docker/frontend.Dockerfile`: multi-stage build (Node build → Nginx serve) for the Angular app.
- `docker-compose.yml`: `postgres` (with a named volume), `backend` (depends_on postgres, reads connection string from env), `frontend` (depends_on backend). All on one network.
- `docker-compose.override.yml`: dev-friendly overrides (exposed ports, volume mounts for live reload if reasonably easy to set up; otherwise leave a comment explaining how to run each side locally with `dotnet watch` / `ng serve` instead).
- `.env.example` listing every variable the compose files and `appsettings` expect (DB name/user/password, JWT signing key, API URL), with placeholder values — never real secrets.

## CI

- `backend-ci.yml`: on PR to `dev`/`main` — restore, build, run tests for the backend solution.
- `frontend-ci.yml`: on PR to `dev`/`main` — `npm ci`, lint, build the Angular app.
- Keep them minimal; no deploy, no Docker push yet.

## Repo hygiene

- `.editorconfig` covering both C# and TypeScript conventions.
- `.gitignore` covering .NET (`bin/`, `obj/`), Node (`node_modules/`, `dist/`), and environment files (`.env`).
- Root `README.md`: what this repo is, the folder layout above, how to run everything locally with `docker-compose up`, how to run backend/frontend independently for development, and a short "where do I add my feature" pointer per module (Domain → Application → Infrastructure → Api → matching Angular feature folder), plus a link to `docs/architecture-decisions.md` and `docs/meeting-summary.md`.

## Constraints — read twice

- No business logic. Every endpoint/component beyond auth is a thin, working pass-through, not a feature.
- Everything must actually build and run end-to-end via `docker-compose up` (migrations apply, API responds on Swagger, frontend loads and can hit at least one real endpoint) — a skeleton that doesn't run is worse than no skeleton.
- Keep module folders (`Events`, `Discounts`, `Info`) symmetrical across Domain/Application/Infrastructure/Api/Angular features, so any team member can find "their" module in the same relative spot in every layer.
- Follow the existing branch/PR rules already set up on the repo (`feature/*` → `dev` → `main`, PR + 1 approval) — don't push directly to `main` or `dev` if you're committing this yourself; open it as a PR into `dev`.
