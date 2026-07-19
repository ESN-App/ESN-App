# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Monorepo skeleton for the **ESN Gdańsk App** — a non-profit PWA for the ESN Gdańsk chapter (Events, Discounts, practical Info for incoming Erasmus students). Every module is wired end-to-end (routing, DI, DB, auth, build, CI) but intentionally contains no business logic yet. The canonical remote is `github.com/ESN-App/ESN-App`.

Background docs (source of truth for decisions):

- [docs/skeleton-implementation.md](docs/skeleton-implementation.md) — implementation notes: API surface, request/auth flow, config variable reference, seeding, caveats
- [docs/adr/](docs/adr) — decision records; record new architecture decisions here (ADR-001: latest-stable version policy, ADR-002: same-origin API proxy, ADR-003: `main` retired, `dev` is primary)
- [docs/architecture-decisions.md](docs/architecture-decisions.md) — why monorepo, Clean Architecture, Angular Material, scaffolded auth
- [docs/meeting-summary.md](docs/meeting-summary.md) — confirmed stack, MVP scope, GitHub workflow
- [claude-code-skeleton-prompt.md](claude-code-skeleton-prompt.md) — the spec this skeleton was generated from
- [DEV_SETUP_PLAN.md](DEV_SETUP_PLAN.md) — phased team quality-setup checklist (partially done; branch rules/Projects live on GitHub)
- [REQUIREMENTS.md](REQUIREMENTS.md) — toolchain and package versions; policy is latest stable everywhere (this overrides older version references in the docs above)

## Commands

Backend (from `backend/`; requires the .NET 10 SDK — projects target net10.0):

```bash
dotnet build EsnApp.sln
dotnet test EsnApp.sln                        # run all tests
dotnet test tests/EsnApp.Api.Tests            # run one test project
dotnet run --project src/EsnApp.Api           # http://localhost:5000/swagger (needs postgres running)
dotnet tool restore                           # installs pinned dotnet-ef
dotnet ef migrations add <Name> --project src/EsnApp.Infrastructure --startup-project src/EsnApp.Api
```

Frontend (from `frontend/`; Angular 22 + TypeScript 6 — requires Node ≥ 24.15, the Angular CLI hard-fails on older Node):

```bash
npm start        # dev server on http://localhost:4200, API base http://localhost:5000
npm run lint     # ESLint (angular-eslint)
npm test         # vitest via ng test; add --watch=false for single run
npm run build    # production build (apiBaseUrl '' — nginx proxies /api same-origin)
```

Full stack: `cp .env.example .env && docker compose up --build` → frontend :4200, API :5000, postgres :5432. On startup the backend applies migrations and seeds sample data + dev admin (`admin@esngdansk.local` / `Admin123!`) when `Database:ApplyMigrationsOnStartup` is true (Development/compose only).

## Architecture

Backend is Clean Architecture, four projects with dependencies pointing inward:
`Domain` (entities only) ← `Application` (MediatR use cases, DTOs, repository interfaces, FluentValidation) ← `Infrastructure` (EF Core/Npgsql `AppDbContext`, Identity + JWT, repository implementations, `DbSeeder`) ← `Api` (controllers, Swagger, exception middleware, `/health`).

Key mechanics that span files:

- Requests flow Controller → MediatR `ISender` → handler → repository interface (Application) → implementation (Infrastructure). Handlers return `Result<T>` ([Result.cs](backend/src/EsnApp.Application/Common/Result.cs)); controllers map failure to 404/400.
- `ValidationBehavior` (MediatR pipeline) runs FluentValidation validators and throws `ValidationException`, which [ExceptionHandlingMiddleware](backend/src/EsnApp.Api/Middleware/ExceptionHandlingMiddleware.cs) turns into a 400 ProblemDetails.
- `AppDbContext.SaveChangesAsync` auto-sets `Id`/`CreatedAt`/`UpdatedAt` on `BaseEntity` — don't set them by hand.
- DI is composed via `AddApplication()` and `AddInfrastructure(config)` extension methods; register new services there.
- Auth: ASP.NET Identity + JWT bearer. Public GETs are anonymous; POSTs carry `[Authorize]` as the pattern for future staff-only endpoints. `AuthController` (register/login) is the one fully functional feature.
- Integration tests use `WebApplicationFactory<Program>` (hence `public partial class Program` in Program.cs) with environment "Testing" so no DB is touched.

Frontend: standalone components, signals, zoneless. `core/` has `AuthService` (token in localStorage, exposed as signals), a functional JWT interceptor, and an auth guard. Each feature in `features/{events,discounts,info,auth}/` is a lazy-loaded route with an `*-api.ts` service calling the backend. Environments: `environment.development.ts` (API at localhost:5000, used by `ng serve` via fileReplacements) vs `environment.ts` (empty apiBaseUrl for the nginx-proxied production build).

**Module symmetry rule:** Events, Discounts (incl. Partners), and Info live in the same relative spot in every layer — Domain/Application folder, Infrastructure repository, Api controller, Angular feature folder. Keep new modules and additions symmetrical so each team member can own a module end-to-end.

## Conventions

- Conventional Commits (`feat(events): …`); branches `feature/*`, `fix/*`, `chore/*`, `docs/*` off `dev`; PR into `dev` (1 approval). `dev` is the primary/production branch — `main` was retired (see ADR-003). Never push directly to `dev`.
- All DB changes via EF Core migrations (review generated SQL before applying); never edit the schema directly.
- Every endpoint keeps Swagger annotations (`ProducesResponseType`, XML summary).
- Secrets only via environment variables / `.env` (gitignored); `.env.example` documents every variable. The JWT dev key and seed password in appsettings/compose defaults are dev-only placeholders.
- CI (`.github/workflows/`) runs on PRs into `dev`: backend restore/build/test on .NET 10, frontend `npm ci`/lint/build on Node 24.
- Version policy: latest stable for every framework/package; keep [REQUIREMENTS.md](REQUIREMENTS.md) in sync when versions change.
