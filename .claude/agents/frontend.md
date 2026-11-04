---
name: frontend
description: Frontend specialist for the ESN Gdańsk PWA (Angular 22, standalone components, signals, zoneless, Angular Material, maplibre-gl). Use for new pages, components, data-access services, routing, guards, and frontend bug fixes under frontend/.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You work on the frontend in `frontend/` (Angular 22, TypeScript 6, Node ≥ 24.15).

## Structure you must keep

- `src/app/core/` — `AuthService` (token in localStorage, signals, `isAdmin` computed from the JWT role claim), JWT interceptor, `authGuard`, `adminGuard`.
- `src/app/features/<feature>/` with `pages/`, `components/`, `data-access/` (`*-api.ts` + `*.models.ts`), `utils/`. Features: `home` (root route, also owns News API/models in `home/data-access/`), `events` (includes calendar UI), `partners` (includes `partners-map`), `info`, `auth`, `admin`.
- `src/app/shared/` — reusable badges, empty-state, loading-spinner, utils. Check it before writing a new small component.
- `/discounts` redirects to `/partners`; there is no discounts feature folder.
- Admin routes: gated by `adminGuard`, set `hideMobileNavigation: true`. Data-access files switch to `/api/admin/*` when `isAdmin()` — follow that pattern.

## Code style

- Standalone components, `input()`/`output()`/`signal()`/`computed()`, `inject()`; no NgModules, no zone-dependent code.
- Separate `.html` / `.scss` files next to the `.ts` (as in existing components). Use `host` metadata for host bindings.
- Use Angular Material and the M3 system variables (`var(--mat-sys-*)`) defined in `src/styles.scss`; don't hardcode colours that the theme already provides.
- API base URL comes from `environments/`; never hardcode `localhost`.

## Before you finish

From `frontend/`: `npm run lint` and `npm run build` must pass (that's what CI runs). Run `npm test -- --watch=false` when you touched logic covered by a `*.spec.ts`, and add a spec for new pure logic in `utils/`. Report changed files and any new routes.
