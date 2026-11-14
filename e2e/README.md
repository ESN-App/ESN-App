# E2E tests

Playwright suite that runs against the full stack. CI: `.github/workflows/e2e.yml`.

Projects: `mobile` (Chromium 390x844, touch), `desktop` (Chromium 1280x800) and `webkit` (iPhone 14 descriptor, 390x844, isMobile/hasTouch).

## Run locally

From the repo root, start postgres, the API (migrations + seed, dev admin `admin@esngdansk.local` / `Admin123!`) and the nginx frontend:

```bash
docker compose up -d --build        # frontend :4200, API :5080
```

Then, with Node 24:

```bash
cd e2e
npm ci
npx playwright install chromium webkit
npx playwright test                       # add --project=mobile / --ui / --headed as needed
```

`E2E_BASE_URL` overrides the target (default `http://localhost:4200`). Never point it at a deployed environment: the admin specs create and delete data.

Stop the stack with `docker compose down` (add `-v` only if you want to wipe the database).

## Layout

- `tests/public.spec.ts`, `student.spec.ts` - student side (navigation, events, calendar, search, news, drafts hidden, not-found).
- `tests/admin.spec.ts`, `admin-crud.spec.ts`, `forms.spec.ts` - admin panel (login, CRUD, bulk actions, list tools, validation, dialogs).
- `tests/fixtures.ts` - every test fails on a console error, an uncaught exception or an API 5xx (allowlist with reasons is in that file); the `admin` fixture deletes all `E2E ...` records when the test ends.
- `tests/helpers.ts` - login helper and an admin REST client for arranging data fast.

Test data is always named `E2E ...` (admin accounts `e2e-...`); if a run is killed, the next test that uses the `admin` fixture purges leftovers.
