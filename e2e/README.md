# E2E tests

Playwright suite (Chromium, 390x844 `mobile` and 1280x800 `desktop` projects) that runs against the full stack. CI: `.github/workflows/e2e.yml`.

## Run locally

From the repo root, start postgres, the API (migrations + seed, dev admin `admin@esngdansk.local` / `Admin123!`) and the nginx frontend:

```bash
docker compose up -d --build        # frontend :4200, API :5080
```

Then, with Node 24:

```bash
cd e2e
npm ci
npx playwright install chromium
npx playwright test                 # add --project=mobile / --ui / --headed as needed
```

`E2E_BASE_URL` overrides the target (default `http://localhost:4200`). Never point it at a deployed environment: the admin specs create and delete data.

Stop the stack with `docker compose down` (add `-v` only if you want to wipe the database).
