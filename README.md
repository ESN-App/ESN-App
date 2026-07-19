# ESN Gdańsk App

Non-profit PWA for the ESN Gdańsk chapter: one app for incoming Erasmus students with **Events**, **Discounts**, and practical **Info** about their stay. This repo is a monorepo skeleton — every module is wired end-to-end (routing, DI, database, auth, build) but intentionally contains no business logic yet.

Documentation map:

- [docs/skeleton-implementation.md](docs/skeleton-implementation.md) — what exists, request/auth flow, API surface, every config variable
- [docs/architecture-decisions.md](docs/architecture-decisions.md) and [docs/meeting-summary.md](docs/meeting-summary.md) — how and why these choices were made
- [docs/adr/](docs/adr) — architecture decision records (new decisions go here)
- [REQUIREMENTS.md](REQUIREMENTS.md) — toolchain and package versions

## Stack

| Layer | Choice |
|---|---|
| Backend | .NET 10 Web API, Clean Architecture, EF Core 10 + PostgreSQL, Identity + JWT, Swagger |
| Frontend | Angular 22 (standalone components) + Angular Material, PWA |
| Containers | Docker Compose |
| CI | GitHub Actions (PRs into `dev` — the primary/production branch) |

Version policy: latest stable everywhere — exact versions and upgrade steps live in [REQUIREMENTS.md](REQUIREMENTS.md).

## Repo layout

```
backend/
  src/EsnApp.Domain/           # Entities. No dependencies.
  src/EsnApp.Application/      # Use cases (MediatR), DTOs, repository interfaces, validation.
  src/EsnApp.Infrastructure/   # EF Core + Npgsql, Identity/JWT, repository implementations.
  src/EsnApp.Api/              # Controllers, Swagger, middleware, DI wiring.
  tests/                       # xUnit test projects (unit + WebApplicationFactory integration).
frontend/
  src/app/core/                # AuthService, JWT interceptor, auth guard.
  src/app/shared/              # Reusable components (spinner, empty state).
  src/app/features/            # events / discounts / info / auth — lazy-loaded routes.
docker/                        # Dockerfiles + nginx config.
docs/                          # Architecture decisions, meeting notes.
.github/workflows/             # backend-ci.yml, frontend-ci.yml.
```

## Run everything with Docker

Prerequisite: Docker Desktop.

```bash
cp .env.example .env   # defaults work out of the box for local dev
docker compose up --build
```

- Frontend: http://localhost:4200
- API + Swagger: http://localhost:5000/swagger
- Health check: http://localhost:5000/health
- PostgreSQL: localhost:5432

On first start the backend applies EF Core migrations and seeds sample data plus a dev admin account (`admin@esngdansk.local` / `Admin123!` — dev only, configurable in `.env`).

## Run backend and frontend natively (hot reload)

Prerequisites: .NET 10 SDK, Node.js ≥ 24.15 (see [REQUIREMENTS.md](REQUIREMENTS.md)).

```bash
# database only
docker compose up -d postgres

# backend — http://localhost:5000, Swagger at /swagger
cd backend
dotnet run --project src/EsnApp.Api

# frontend — http://localhost:4200, proxies API calls to localhost:5000
cd frontend
npm install
npm start
```

### Tests, lint, migrations

```bash
# backend
cd backend
dotnet test EsnApp.sln
dotnet ef migrations add <Name> --project src/EsnApp.Infrastructure --startup-project src/EsnApp.Api

# frontend
cd frontend
npm run lint
npm test
npm run build
```

Never edit the database schema directly — always add an EF Core migration and review it before applying.

## Where do I add my feature?

Each module lives in the same relative spot in every layer. To extend (for example) Events:

1. `backend/src/EsnApp.Domain/Events/` — entity changes.
2. `backend/src/EsnApp.Application/Events/` — DTOs, use cases (queries/commands), validators, repository interface.
3. `backend/src/EsnApp.Infrastructure/Persistence/` — repository implementation, DbContext config, migration.
4. `backend/src/EsnApp.Api/Controllers/EventsController.cs` — endpoints (keep Swagger annotations current).
5. `frontend/src/app/features/events/` — API service, components, routes.

Discounts (incl. Partners) and Info follow the identical pattern. Auth is already functional end-to-end (register/login → JWT → `[Authorize]` on POST endpoints, token attached by the Angular interceptor).

## Workflow

- Branch from `dev`: `feature/*`, `fix/*`, `chore/*`, `docs/*`
- Conventional Commits: `feat(events): add events list endpoint`
- PR into `dev` (1 approval required). `dev` is the primary/production branch — `main` was retired, see [ADR-003](docs/adr/003-retire-main-dev-is-primary.md). No direct pushes — rulesets enforce this.
- CI must be green: backend restore/build/test, frontend install/lint/build.

Full project docs live in Notion (ESN APP workspace); team comms in Discord.
