# ADR-002: Same-origin API access in production (nginx proxy), CORS only for dev

## Status

Accepted (2026-07-07).

## Context

The Angular PWA needs to call the .NET API. Options: expose the API on a separate origin and configure CORS everywhere, or serve both from one origin. The production API hostname is unknown at skeleton time (hosting undecided).

## Decision

- **Production / Docker**: the frontend nginx container proxies `/api`, `/health`, and `/swagger` to the backend container (`docker/nginx.conf`). The production Angular build uses `apiBaseUrl: ''`, so all calls are same-origin and no CORS or hardcoded API hostname is needed.
- **Development**: `ng serve` (localhost:4200) calls the API directly on `http://localhost:5000` (`environment.development.ts`); the backend allows this origin via the `Cors__AllowedOrigins` setting.

## Consequences

- No production API URL is baked into the frontend bundle; deploying to any host only requires routing `/api` to the backend.
- The CORS allowlist stays dev-only. If the API is ever exposed on its own public origin, add that origin explicitly — never `*`.
- WebSocket or non-`/api` endpoints added later must also be added to `docker/nginx.conf`.
