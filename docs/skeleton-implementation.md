# Skeleton Implementation Notes

Generated 2026-07-07, when the monorepo skeleton was scaffolded per [architecture-decisions.md](architecture-decisions.md). This documents what actually exists, how the pieces connect, and every configuration knob. Update it when the architecture changes.

## What exists

- **Backend**: .NET 10 Web API, Clean Architecture (4 projects), EF Core 10 + PostgreSQL, ASP.NET Core Identity + JWT, Swagger, health check, global exception handling, 2 test projects (4 passing tests).
- **Frontend**: Angular 22 workspace (standalone components, signals, zoneless), Angular Material, PWA (service worker + manifest), ESLint, vitest. Lazy-loaded feature per module.
- **Infra**: Docker Compose (postgres 18, backend, frontend behind nginx), GitHub Actions CI for both sides.
- **No business logic anywhere** — endpoints/components are thin, working pass-throughs. Auth is the one fully functional flow.

Exact tool/package versions: [REQUIREMENTS.md](../REQUIREMENTS.md).

## Backend

### Request flow

```
Controller → MediatR ISender → Query/Command handler → repository interface (Application)
                                                        → EF Core implementation (Infrastructure)
```

- Handlers return `Result<T>` (`Application/Common/Result.cs`); controllers translate: success → 200/201, failure → 404 (detail lookups) or 400 (e.g. unknown PartnerId on discount create).
- FluentValidation validators run automatically via `ValidationBehavior` (MediatR pipeline). A failed validation throws `ValidationException`, which `ExceptionHandlingMiddleware` converts to a 400 `ValidationProblemDetails`. Any other exception becomes a logged 500 `ProblemDetails`.
- `AppDbContext.SaveChangesAsync` assigns `Id` (Guid), `CreatedAt`, `UpdatedAt` on every `BaseEntity` — never set these manually.
- DI composition: `AddApplication()` (MediatR + validators) and `AddInfrastructure(configuration)` (DbContext, Identity, JWT bearer, repositories). Register new services in those extension methods.

### API surface

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/health` | — | liveness check (no DB probe) |
| GET | `/swagger` | — | Swagger UI with JWT bearer support |
| POST | `/api/auth/register` | — | creates account, returns `{ token, expiresAt, email }` |
| POST | `/api/auth/login` | — | 401 with error message on bad credentials |
| GET | `/api/events`, `/api/events/{id}` | — | list / detail (404 if missing) |
| POST | `/api/events` | JWT | placeholder create |
| GET/POST | `/api/discounts`, `/api/discounts/{id}` | POST: JWT | discounts include `partnerName`; create validates PartnerId |
| GET/POST | `/api/partners`, `/api/partners/{id}` | POST: JWT | |
| GET/POST | `/api/info`, `/api/info/{id}` | POST: JWT | info articles |

Pattern: public reads are anonymous, writes carry `[Authorize]` — the template for future staff-only management endpoints (role checks not implemented yet; an `Admin` role is seeded and included in JWT claims).

### Configuration reference

All settings can be supplied as environment variables (`Section__Key` syntax). Defaults live in `appsettings.json` / `appsettings.Development.json`.

| Key | Purpose | Default |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | empty (Development: localhost esn_dev) |
| `Jwt__Issuer` / `Jwt__Audience` | token validation | `EsnApp` |
| `Jwt__Key` | HMAC signing key, ≥ 32 chars | dev-only placeholder — **must be overridden in production** |
| `Jwt__ExpiryMinutes` | access token lifetime | 60 |
| `Cors__AllowedOrigins` | array of allowed origins (dev only; prod is same-origin) | `http://localhost:4200` |
| `Database__ApplyMigrationsOnStartup` | migrate + seed on boot | `false` (true in Development and compose) |
| `Seed__AdminEmail` / `Seed__AdminPassword` | dev admin account; skipped when empty | empty (Development: `admin@esngdansk.local` / `Admin123!`) |

Compose-level variables (`.env`, see `.env.example`): `POSTGRES_DB/USER/PASSWORD`, `ASPNETCORE_ENVIRONMENT`, `JWT_KEY`, `SEED_ADMIN_EMAIL/PASSWORD`.

### Database

- Migrations live in `backend/src/EsnApp.Infrastructure/Persistence/Migrations/`; the EF CLI is a pinned local tool (`backend/dotnet-tools.json`, run `dotnet tool restore` once).
- `DbSeeder` (runs only when `Database:ApplyMigrationsOnStartup` is true): applies migrations, creates the `Admin` role, the dev admin user, and sample rows (2 events, 1 partner + discount, 1 article) into empty tables.
- Entities: `Event`, `Partner`, `Discount` (FK → Partner, cascade delete), `InfoArticle`, plus Identity tables (`ApplicationUser : IdentityUser`).

### Tests

- `EsnApp.Application.Tests` — handler unit tests with an in-memory fake repository (no mocking library).
- `EsnApp.Api.Tests` — `WebApplicationFactory<Program>` integration tests (environment `Testing`, no DB connection opened): `/health` and `/swagger/v1/swagger.json` return 200. This boots the entire DI graph, so wiring mistakes fail these tests.

## Frontend

- `core/` — `AuthService` (login/register/logout; token + email persisted in localStorage, exposed as signals), functional `authInterceptor` (adds `Authorization: Bearer`), `authGuard` (redirects to `/auth`). Registered in `app.config.ts`.
- `shared/` — `LoadingSpinner`, `EmptyState`, exported via barrel `shared/index.ts`.
- `features/{events,discounts,info,auth}/` — each has `*-api.ts` (typed HTTP service), a list component (Material cards, loading/empty states), and a `*.routes.ts` wired lazily from `app.routes.ts`. `auth/` is a combined login/register page with reactive forms.
- Environments: `environment.development.ts` (`apiBaseUrl: http://localhost:5000`, used by `ng serve` via fileReplacements) vs `environment.ts` (`apiBaseUrl: ''` — production is served by nginx which proxies `/api`, see [ADR-002](adr/002-same-origin-api-proxy.md)).
- PWA: service worker enabled only in production builds (`ngsw-config.json`).

## Docker & CI

- `docker compose up --build`: postgres (healthcheck-gated) → backend (auto-migrates + seeds) → frontend. Ports (dev override): frontend 4200, API 5000, postgres 5432.
- Hot-reload workflow: run only `postgres` in Docker, backend via `dotnet run`, frontend via `npm start` (see README).
- CI (`.github/workflows/`): backend restore/build/test on .NET 10; frontend `npm ci` + lint + build on Node 24. Triggered on PRs into `dev` and `main`. No deploy step yet.

## Known caveats

- `docker compose up` has not been executed on a machine with Docker yet — the compose files are written to spec but unverified end-to-end.
- MediatR ≥ 13 is commercially licensed (free tier for non-profits/small teams; logs a notice without a license key). Fine for ESN, but revisit before any commercial reuse — see REQUIREMENTS.md.
- Rate limiting, refresh tokens, Dependabot, Husky/commitlint (DEV_SETUP_PLAN phases 3/7) are not set up yet.
