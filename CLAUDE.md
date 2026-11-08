# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Monorepo for the **ESN Gdańsk App** — a non-profit PWA for the ESN Gdańsk chapter (Events, Partners/discounts with a map, practical Info for incoming Erasmus students, News, and a role-gated Admin panel). Events, Info, News, Partners and the Admin panel are fully wired with real CRUD and role-based auth. The canonical remote is `github.com/ESN-App/ESN-App`; it is live on Render (see Deployment).

Design source of truth: the Penpot file **"ESNapp mockup v3"** (student mobile/desktop, admin panel, component boards such as "Event badges" and "No-image placeholder"). New UI is designed there first, then implemented.

Background docs (originally the source of truth for decisions — **now historical/point-in-time snapshots from the skeleton phase**; they predate News, the Admin panel, the Partners map, Calendar UI, and Home, and should not be trusted for current architecture or scope):

- [docs/skeleton-implementation.md](docs/skeleton-implementation.md) — implementation notes as of the initial skeleton (dated 2026-07-07); API surface table and "auth is the only working feature" framing are stale, see Architecture below for current state
- [docs/adr/](docs/adr) — decision records (ADR-001: latest-stable version policy, ADR-002: same-origin API proxy, ADR-003: `main` retired — **superseded by ADR-004**, ADR-004: `main` is the primary/production branch again and Render deploys from it). Other architecture-level decisions (Partners superseding Discounts, Home as root route, role-based admin auth) have no ADR yet
- [docs/architecture-decisions.md](docs/architecture-decisions.md) — why monorepo, Clean Architecture, Angular Material, scaffolded auth; module/feature lists in it are stale (missing News, Partners, Home, Admin)
- [docs/meeting-summary.md](docs/meeting-summary.md) — confirmed stack, original MVP scope, GitHub workflow; scope section is a historical snapshot (e.g. lists the Map as deferred "Could Have" — it has since been built)
- [claude-code-skeleton-prompt.md](claude-code-skeleton-prompt.md) — the spec the original skeleton was generated from
- [DEV_SETUP_PLAN.md](DEV_SETUP_PLAN.md) — phased team quality-setup checklist (partially done; branch rules/Projects live on GitHub)
- [REQUIREMENTS.md](REQUIREMENTS.md) — toolchain and package versions; policy is latest stable everywhere; still accurate/kept in sync (this overrides older version references in the docs above)

## Commands

Backend (from `backend/`; requires the .NET 10 SDK — projects target net10.0):

```bash
dotnet build EsnApp.sln
dotnet test EsnApp.sln                        # run all tests
dotnet test tests/EsnApp.Api.Tests            # integration tests (WebApplicationFactory, health/swagger)
dotnet test tests/EsnApp.Application.Tests    # handler unit tests (Events, Info, News, Discounts/Partners, Features, Settings)
dotnet run --project src/EsnApp.Api           # http://localhost:5080/swagger (needs postgres running)
dotnet tool restore                           # installs pinned dotnet-ef
dotnet ef migrations add <Name> --project src/EsnApp.Infrastructure --startup-project src/EsnApp.Api
```

Frontend (from `frontend/`; Angular 22 + TypeScript 6 — requires Node ≥ 24.15, the Angular CLI hard-fails on older Node):

```bash
npm start        # dev server on http://localhost:4200, API base http://localhost:5080
npm run lint     # ESLint (angular-eslint)
npm test         # vitest via ng test; add --watch=false for single run (NOT run in CI — run it yourself)
npm run build    # production build (apiBaseUrl '', nginx proxies /api same-origin)
```

Rebuild just the backend image and restart its container (leaves postgres and its data alone):

```bash
docker compose up -d --build backend    # from the repo root; API back on http://localhost:5080
docker compose logs -f backend          # follow startup: migrations + seeding
```

Full stack: `cp .env.example .env && docker compose up --build` → frontend :4200, API :5080, postgres :5432. On startup the backend applies migrations and seeds sample data + dev admin (`admin@esngdansk.local` / `Admin123!`, assigned the `Admin` Identity role) when `Database:ApplyMigrationsOnStartup` is true (Development/compose only).

## Architecture

Backend is Clean Architecture, four projects with dependencies pointing inward:
`Domain` (entities only) ← `Application` (MediatR use cases, DTOs, repository interfaces, FluentValidation) ← `Infrastructure` (EF Core/Npgsql `AppDbContext`, Identity + JWT, repository implementations, `DbSeeder`) ← `Api` (controllers, Swagger, exception middleware, `/health`).

Domain/Application areas: `Events`, `Info`, `News`, `Discounts` (contains both the legacy `Discount` entity and `Partner`), plus `Identity` in Application and `Common` in each. Info and News additionally have an `Administration` subfolder for their admin-only use cases (reorder, status changes, admin listing) rather than a separate top-level Admin module.

Key mechanics that span files:

- Requests flow Controller → MediatR `ISender` → handler → repository interface (Application) → implementation (Infrastructure). Handlers return `Result<T>` ([Result.cs](backend/src/EsnApp.Application/Common/Result.cs)); controllers map failure to 404/400.
- `ValidationBehavior` (MediatR pipeline) runs FluentValidation validators and throws `ValidationException`, which [ExceptionHandlingMiddleware](backend/src/EsnApp.Api/Middleware/ExceptionHandlingMiddleware.cs) turns into a 400 ProblemDetails.
- `AppDbContext.SaveChangesAsync` auto-sets `Id`/`CreatedAt`/`UpdatedAt` on `BaseEntity` — don't set them by hand.
- DI is composed via `AddApplication()` and `AddInfrastructure(config)` extension methods; register new services there.
- Auth: ASP.NET Identity + JWT bearer, **with role-based authorization now live** (not just scaffolded). `DbSeeder` creates an `Admin` Identity role and assigns it to the seeded admin user; the JWT carries a role claim. Each module that needs admin management pairs a public read-only controller with an `Admin*Controller` guarded by `[Authorize(Roles = "Admin")]`: `EventsController`/`AdminEventsController`, `InfoController`/`AdminInfoController`, `NewsController`/`AdminNewsController`, `PartnersController`/`AdminPartnersController`, plus `AdminUsersController` (`/api/admin/admins`, GET-only list of admins). `AuthController` (login + token-based password reset) is the entry point; Events, Info, News and Partners all have full admin CRUD.
  - **Public/admin split is enforced by route, not just by attribute**: every public controller (`EventsController`, `InfoController`, `NewsController`, `PartnersController`, `DiscountsController`) is **GET-only and anonymous**; every create/update/delete lives under `api/admin/*` on an `Admin*Controller` with `[Authorize(Roles = "Admin")]`. The only anonymous non-GET endpoints are `POST /api/auth/login` and `POST /api/auth/reset-password` (the latter needs the emailed token). There is no self-service registration — admin accounts are created only through `POST /api/admin/admins`. Keep it that way: a write endpoint on a public controller is a bug, even when it carries a role attribute.
  - **Partners/Discounts** is now symmetric on the backend: `AdminPartnersController` has full CRUD (multipart create/update with logo upload), status PATCH and `PUT order`, and `AdminDiscountsController` (`api/admin/discounts`) owns offer create/update/delete plus an admin list that includes offers of non-public partners. `Discount` is *not* vestigial — it is the "offers" belonging to a `Partner`, managed from the partner rows in the admin panel. Public `GET /api/discounts` returns only offers of `Active` partners; the admin frontend reads `GET /api/admin/discounts` instead (`partners-api.ts` switches on `isAdmin()`, same pattern as partners/news/info).

  - **Site-wide settings**: `FeatureFlags` (booleans, `GET /api/features`, admin `GET/PUT /api/admin/features/{key}`) and `SiteSettings` (key/value; `timeZone`, default `Europe/Warsaw`; `GET /api/settings`, admin `GET/PUT /api/admin/settings`, IANA ids only). `GET /api/version` reports the deployed version/commit.
  - **Audit**: `CreatorTrackedEntity` records `CreatedBy*`/`UpdatedBy*` in `AppDbContext.ApplyAuditFields()` (skips DisplayOrder-only changes).

- Integration tests use `WebApplicationFactory<Program>` (hence `public partial class Program` in Program.cs) with environment "Testing" so no DB is touched. Two backend test projects: `EsnApp.Api.Tests` (integration, incl. route/auth checks) and `EsnApp.Application.Tests` (handler unit tests).

Frontend: standalone components, signals, zoneless. `core/` has `AuthService` (token in localStorage, exposed as signals, including an `isAdmin` computed signal derived from the JWT's role claim), functional interceptors (`authInterceptor`, `retryInterceptor` — retries GETs while the free Render API wakes up), `authGuard`/`adminGuard`, `FeatureFlags`, `SiteSettings` (site time zone signal) and `AppUpdate` (service-worker updates: checks on start/visibility/30 min, loads the new build on the next in-app navigation, never mid-form).

Cross-cutting frontend pieces worth knowing before changing related code:
- **Dates**: always display with the `appDate` pipe / `shared/utils/time-zone.ts` helpers in the site time zone (never Angular's `date` pipe on instants — its timezone param can't do DST); admin date-time input converts wall time in the site zone to UTC. Day grouping, month filters and Today/Tomorrow badges use the site zone too.
- **Data cache**: `shared/utils/response-cache.ts` (stale-while-revalidate, keyed by role, cleared on any token change; 404/410 drops the entry) backs the public data-access services so list → details and Back render instantly.
- **Motion**: tokens `--motion-fast/base/slow`, `--ease-standard/exit` in `styles.scss`; route transitions via `withViewTransitions` + `shared/utils/detail-transition.ts` (shared image morph between `data-hero-source` and `data-hero-target`, `vt-instant` for query-only changes); `appImageFade`, `appStaggerIn`, `appSlidingIndicator`, content-shaped `app-skeleton` variants. Every animation must respect `prefers-reduced-motion`. Brand: ESN star at full opacity, no rotation.

Feature folders under `features/`: `home` (root route `''`, pulls in News highlights via `home/data-access/news-api.ts` — News has no dedicated frontend feature folder of its own), `events` (includes the Calendar UI — a `MatCalendar` panel plus a custom mobile date strip, built into `events-list`, not a separate feature), `partners` (includes the map, `partners-map.ts`, built on `maplibre-gl`; `Partner` has `Latitude`/`Longitude`), `info`, `auth`, and `admin` (the admin panel — see below). There is **no `discounts` feature folder**; `/discounts` is a redirect to `/partners` (the product pivoted to "Partners" as the user-facing concept; `Discount` survives on the backend as a partner's *offers*, edited from the partner rows in the admin panel).

`features/admin/` is a cross-cutting UI aggregator, not tied to one backend domain: `pages/admin-panel` is a single dashboard with tabs for events/news/partners/info/admins/settings (search, sort, pagination, multi-select, bulk status/delete, backed by `data-access/admin-api.ts`; Settings holds the time zone, feature flags and the live version card; admin actions report through `AdminToast`), `pages/admin-{event,news,partner,info}-form` are one component per entity serving both the create route (`<entity>/new`) and the edit route (`<entity>/:id/edit`, switching on the route param), `pages/admin-admin-create` creates admin accounts, and `components/admin-date-time-picker` is a shared widget used by the event form. All admin routes set `hideMobileNavigation: true` and are gated by `adminGuard`.

**Module symmetry**: still a useful default, but no longer universal — apply it deliberately rather than assuming it:
- Events and Info are symmetric end-to-end (Domain/Application folder, public + Admin controller pair, Angular feature folder with its own data-access).
- News is symmetric on the backend (Domain/Application/public+Admin controllers) but **not** on the frontend — its API/models live under `home/data-access/` instead of a `features/news/` folder.
- Partners/Discounts is symmetric on the backend (public read-only controller + `Admin*Controller` pair for both `Partner` and `Discount`) but shares one frontend feature folder (`features/partners/`), with offer editing living in the admin panel rather than a `discounts` feature.
- `admin` and `home` are intentionally cross-cutting composition features on the frontend with no single backend domain counterpart — don't look for a `Domain/Admin` or `Domain/Home`, there isn't one.

## Deployment

Render Blueprint ([render.yaml](render.yaml), region Frankfurt): Render Postgres (free), `esn-gdansk-api` (Docker, `docker/backend.Dockerfile`, migrations + seed on startup) and `esn-gdansk-web` (Docker, nginx from `docker/nginx.conf.template`, proxies `/api` to `API_UPSTREAM` so the API stays same-origin per ADR-002, serves `/version.json`). Free-tier limits: services sleep after 15 min (~50 s cold start), SMTP is blocked, the disk is ephemeral (uploaded images are lost on redeploy), the free database expires after 30 days.

Releases: the root `VERSION` file holds the semver version (started at 0.3.20). After each merge into `main`, `.github/workflows/release.yml` bumps it (PR label `release:major` / `release:minor`, otherwise patch), tags `vX.Y.Z` and triggers both Render deploy hooks (secrets `RENDER_DEPLOY_HOOK_API` / `RENDER_DEPLOY_HOOK_WEB`; auto-deploy is off). Suggest the bump level for every PR you open.

## Conventions

- Conventional Commits (`feat(events): …`); one change = one branch off fresh `origin/main` (`feature/*`/`feat/*`, `fix/*`, `chore/*`, `docs/*`) and one PR into `main` (see ADR-004). PRs are squash-merged by a human; never push directly to `main`, never force-push a shared branch.
- Don't stack PRs on other open PRs (squash merges turn that into conflicts). Before handing a PR over, merge the latest `origin/main` into it, make sure the build passes, and check `gh pr view <n> --json mergeable` is `MERGEABLE`.
- No `Co-Authored-By`, `Claude-Session` or session-link lines in commits or PR bodies.
- Subagents in `.claude/agents/`: `frontend` and `backend` write code in their area, `ui-ux` designs in Penpot and reviews visuals only, `tests` checks that the app works, `security` reviews read-only. Nothing is handed to the user before `tests` (and `ui-ux` for visible changes) have checked it. Browser QA runs as headless Playwright scripts from the shared install `~/.cache/esn-qa` (no Playwright MCP — it burns tokens and leaves a shared visible browser behind).
- All DB changes via EF Core migrations (review generated SQL before applying); never edit the schema directly.
- Every endpoint keeps Swagger annotations (`ProducesResponseType`, XML summary).
- Secrets only via environment variables / `.env` (gitignored); `.env.example` documents every variable. The JWT dev key and seed password in appsettings/compose defaults are dev-only placeholders.
- CI (`.github/workflows/`): `backend-ci.yml` (restore/build/test on .NET 10), `frontend-ci.yml` (`npm ci`/lint/build on Node 24 — **frontend CI does not run `npm test`**), `copilot-review.yml` (Copilot review on non-draft PRs, mirroring a repo ruleset) and `release.yml` (see Deployment). They trigger on PRs into `main` (and the legacy `dev`).
- Version policy: latest stable for every framework/package; keep [REQUIREMENTS.md](REQUIREMENTS.md) in sync when versions change. `maplibre-gl` was added for the Partners map.
