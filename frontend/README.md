# ESN App — Frontend

Angular 22 + Angular Material PWA. Full project documentation lives in the [root README](../README.md) and [docs/skeleton-implementation.md](../docs/skeleton-implementation.md); toolchain versions in [REQUIREMENTS.md](../REQUIREMENTS.md).

Requires Node ≥ 24.15 (the Angular CLI refuses to run on older versions).

```bash
npm install
npm start          # dev server on http://localhost:4200, API expected on http://localhost:5000
npm run lint       # ESLint
npm test           # vitest (add -- --watch=false for a single run)
npm run build      # production build (dist/esn-app; API is same-origin via nginx proxy)
```

Structure (see root README "Where do I add my feature?"):

- `src/app/core/` — AuthService, JWT interceptor, auth guard
- `src/app/shared/` — reusable components (barrel export)
- `src/app/features/{events,discounts,info,auth}/` — one lazy-loaded folder per module: `*-api.ts` service, list component, `*.routes.ts`
- `src/environments/` — `environment.development.ts` is used by `ng serve` (fileReplacements in angular.json)
