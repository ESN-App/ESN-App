# Known limitations and tech debt

[Back to index](README.md) · Facts only. Decisions about these belong in ADRs.

## Hosting (Render free tier)

| Item | Fact | Issue |
|---|---|---|
| Uploaded images are not persistent | `*ImageStorage` writes to `wwwroot/images/uploads` on the container disk, which Render wipes on every deploy or restart. The UI then falls back to the star tile. | [#24](https://github.com/ESN-App/ESN-App/issues/24) |
| No transactional email | SMTP ports are blocked on free web services; reset links only appear in the API logs. | [#25](https://github.com/ESN-App/ESN-App/issues/25) |
| Database expires | Free Render Postgres expires 30 days after creation (created 2026-11-06). | [#26](https://github.com/ESN-App/ESN-App/issues/26) |
| Cold starts | Both services sleep after 15 min idle; the first request waits about 50 s. | n/a |
| nginx resolves the upstream once | The `API_UPSTREAM` host is resolved at nginx start (comment marked `shortcut:` in [nginx.conf.template](../../docker/nginx.conf.template)). | n/a |

## Data and seeding

| Item | Fact | Issue |
|---|---|---|
| Seed events are in the past | Seeded events are dated Jul to Sep 2026, so a fresh deploy shows no upcoming events. | [#27](https://github.com/ESN-App/ESN-App/issues/27) |
| Sample data is seeded in production too, on every start | `Database__ApplyMigrationsOnStartup=true` on Render runs [`DbSeeder.SeedAsync`](../../backend/src/EsnApp.Infrastructure/Persistence/DbSeeder.cs) at every API start (and the free service restarts after every sleep). News and info are seeded only while their tables are empty. A seed **event** that is missing (matched by title + start time) is added again, so a deleted seed event comes back. A seed **partner** matched by name is overwritten from seed data (texts, logo, status, display order, offers; extra offers are deleted), and a missing one is added again. | n/a |
| Migrations run at app startup | There is no separate migration step; a failing migration stops the API from starting. | n/a |

## Code

| Item | Fact |
|---|---|
| Duplicated image storage | Four near-identical classes in [Api/Services](../../backend/src/EsnApp.Api/Services), and they live in the Api layer rather than behind an Application interface. |
| Inconsistent use-case layout | Info/Features/Settings group admin use cases in `Administration/` (several per file); Events/News/Discounts use one folder per use case. `AdminUsersController` calls `IIdentityService` directly for everything except create. |
| Naming: Discounts vs Partners | The backend area, namespace and table are `Discounts`; the product concept is Partners, and a `Discount` is a partner's offer. |
| News has no frontend feature folder | News API, models and details page live under `features/home`. |
| Temporary feature flag | `pastEventTag` is marked `shortcut:` (#33) and is meant to be removed once the behaviour is permanent. |
| Unbounded in-memory response cache | `ResponseCache` has no eviction (marked `shortcut:`). |
| Auth token handling | The JWT sits in `localStorage` (readable by scripts on the page). There is no refresh token or server-side revocation, and the default lifetime is `Jwt:ExpiryMinutes = 60`. |
| Swagger is public in production | `UseSwagger`/`UseSwaggerUI` run in every environment and nginx proxies `/swagger`. The Swagger security description still mentions `/api/auth/register`, which does not exist. |
| Stale comment | [copilot-review.yml](../../.github/workflows/copilot-review.yml) still calls `dev` the primary branch (ADR-003, superseded by ADR-004). CI workflows also still trigger on `dev`. |

## Product gaps (open issues, for orientation)

- No student accounts, in-app registration or notifications: [#22](https://github.com/ESN-App/ESN-App/issues/22), [#105](https://github.com/ESN-App/ESN-App/issues/105). Payments: [#106](https://github.com/ESN-App/ESN-App/issues/106).
- No i18n (English only): [#44](https://github.com/ESN-App/ESN-App/issues/44). No offline access to content: [#41](https://github.com/ESN-App/ESN-App/issues/41).
- Admin panel UI differs from the v3 mockups: [#29](https://github.com/ESN-App/ESN-App/issues/29), [#56](https://github.com/ESN-App/ESN-App/issues/56).
