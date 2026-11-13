# ESN App — Frontend

React 19 + React Router 8 PWA built with Vite 8. Full project documentation lives in the [root README](../README.md); toolchain versions in [REQUIREMENTS.md](../REQUIREMENTS.md).

Use Node 24 (same as CI and the Docker image).

```bash
npm install
npm start            # Vite dev server on :4200; /api is proxied to http://localhost:5000 (API_PROXY_TARGET overrides)
npm run lint         # ESLint (typescript-eslint + react-hooks)
npm test -- --run    # vitest (jsdom), single run
npm run build        # tsc -b + production build into dist/ (API is same-origin via the nginx proxy)
```

Structure:

- `src/main.tsx`, `src/App.tsx`, `src/routes.tsx` — bootstrap, app shell (toolbar + mobile navigation) and the route table (pages are lazy-loaded)
- `src/core/` — auth store (`useAuth()`), `http` client that attaches the JWT, `AuthGuard` / `AdminGuard`
- `src/shared/` — reusable components, hooks (`useAsync`, `useEscapeKey`, …), formatting helpers
- `src/features/{home,events,partners,info,auth,admin}/` — one folder per feature: `data-access/` API module + models, `components/`, `pages/`

Styling: every component keeps its own `.scss` file. The app was ported from Angular, so components render inside their original `app-*` host element (`shared/host.tsx`) and each stylesheet is wrapped in `@scope (app-x) to (:scope [data-ng-host] > *) { … }`, which reproduces Angular's per-component style encapsulation. Follow the same pattern for new components.
