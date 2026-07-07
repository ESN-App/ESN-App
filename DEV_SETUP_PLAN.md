# ESN Gdańsk App — Development Quality Setup Plan

A step-by-step checklist for the team to complete before writing any feature code.
Work through these phases in order — each one builds on the previous.

---

## Phase 1 — Repository & Git

### 1.1 Repository structure
Create a **monorepo** with two top-level directories:
```
/esn-gdansk-app
  /backend     → .NET solution
  /frontend    → Angular / Next.js PWA
  /docs        → ADRs and any local documentation
  README.md
  .editorconfig
  .gitignore
```
A monorepo keeps CI, issues, and PRs in one place for a small team.

### 1.2 Branch protection rules (GitHub Settings → Branches)
This is the #1 thing teams forget and regret.

- Protect `main` and `dev`:
  - ✅ Require pull request before merging
  - ✅ Require at least **1 approval** (2 for `main`)
  - ✅ Require status checks to pass (add CI checks once set up)
  - ✅ Require branches to be up to date before merging
  - ✅ Do not allow force pushes
  - ✅ Do not allow branch deletion
- Nobody, including admins, should push directly to `main` or `dev`.

### 1.3 Branch naming convention
Agree on and document a convention. Suggested:
```
feature/short-description
fix/short-description
chore/short-description
docs/short-description
```
Example: `feature/events-listing`, `fix/auth-token-refresh`

### 1.4 Commit message convention — Conventional Commits
Adopt [Conventional Commits](https://www.conventionalcommits.org/) from day one.
Format: `type(scope): description`

```
feat(events): add upcoming events list endpoint
fix(auth): correct token expiry calculation
chore(deps): update EF Core to 9.x
docs(api): add swagger description for partners endpoint
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

**Why this matters:** changelogs, semantic versioning, and readable `git log` become automatic. Without it, git history turns into "fix stuff", "wip", "asdf" within two weeks.

Install `commitlint` to enforce it automatically (see Phase 3).

### 1.5 PR template
Create `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## What does this PR do?


## How to test?


## Checklist
- [ ] I tested this locally
- [ ] I added/updated tests where applicable
- [ ] No secrets or env variables are hardcoded
- [ ] Swagger docs updated (if backend)
- [ ] I linked the related issue
```

### 1.6 Issue templates
Create `.github/ISSUE_TEMPLATE/`:
- `bug_report.md` — steps to reproduce, expected vs actual
- `feature_request.md` — user story format: *As a [user], I want [feature] so that [reason]*

### 1.7 GitHub Projects setup
- Create a single Project board with columns: **Backlog → In Progress → In Review → Done**
- Link issues to project automatically via repository settings
- Use **Milestones** to group work by release (MVP v1, MVP v2, Post-MVP Map)
- Labels to add: `bug`, `feature`, `chore`, `docs`, `blocked`, `good first issue`

---

## Phase 2 — Documentation

### 2.1 README.md
Every developer should be able to clone the repo and run the project using only the README. Include:
- Project description (one paragraph)
- Tech stack
- Prerequisites (Node version, .NET version, Docker, etc.)
- Step-by-step local setup for backend and frontend
- How to run tests
- Environment variables (what they are, not their values)
- Deployment overview
- Link to Notion for full docs

### 2.2 CLAUDE.md (AI context file)
Create a `CLAUDE.md` in the repo root. This file is automatically read by Claude Code and Cowork when working in this project, so Claude always has full context without you re-explaining every session.

```markdown
# ESN Gdańsk App

Non-profit PWA for the ESN Gdańsk chapter.

## Stack
- Backend: .NET 9, PostgreSQL, EF Core, Swagger
- Frontend: [Angular/Next.js] PWA
- Hosting: [Vercel/Netlify] (frontend), [Railway/Render] (backend)
- CI: GitHub Actions

## Architecture
- REST API — all endpoints documented via Swagger at /swagger
- Frontend is a PWA consuming the REST API
- No server-side rendering on frontend

## Key conventions
- Conventional Commits (feat/fix/chore/docs/refactor/test/ci)
- Branch naming: type/short-description
- All environment variables go in .env.local (never committed)
- EF Core migrations for all DB changes — never edit the DB directly
- Every endpoint must have Swagger annotations

## Folder structure
/backend/ESN.Api          → controllers, program.cs
/backend/ESN.Application  → services, DTOs
/backend/ESN.Domain       → entities, interfaces
/backend/ESN.Infrastructure → repositories, DB context, migrations
/frontend/src/app         → pages/components
```

Update this file whenever architecture decisions change.

### 2.3 Architecture Decision Records (ADRs)
Store lightweight decision logs in `/docs/adr/`. Format:
```
/docs/adr/
  001-use-pwa-over-flutter.md
  002-postgresql-as-database.md
  003-ef-core-for-orm.md
```

Template for each ADR:
```markdown
# ADR-001: Use PWA over Flutter

## Status
Accepted

## Context
We need a mobile-first app. Flutter requires $99/year for iOS publishing.

## Decision
Build an Angular/Next.js PWA deployed to Vercel/Netlify.

## Consequences
- No native app store presence
- Works on all devices via browser
- Can be installed to home screen
- Zero publishing fees
```

This saves you from re-litigating the same decisions in six months.

### 2.4 Notion structure
Organize your Notion workspace with these sections:
- **📋 Product** — feature specs, user stories, mockups
- **🏗️ Architecture** — high-level diagrams, data model, API contract
- **🔧 Runbooks** — how to deploy, how to roll back, how to run migrations
- **📅 Meetings** — sprint notes, decisions log
- **🐛 Post-mortems** — what broke and why (even on side projects, this is invaluable)

---

## Phase 3 — Code Quality Automation

### 3.1 EditorConfig
Create `.editorconfig` in the root to keep formatting consistent across editors and OSes:
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.cs]
indent_size = 4
```
Without this, Windows/Mac line ending differences pollute diffs.

### 3.2 Frontend linting & formatting
```bash
# ESLint + Prettier
npm install --save-dev eslint prettier eslint-config-prettier
```
Add `.eslintrc` and `.prettierrc`. Add npm scripts:
```json
"lint": "eslint src --ext .ts,.tsx",
"format": "prettier --write src"
```

### 3.3 Backend formatting
Add `dotnet-format` to CI:
```bash
dotnet format --verify-no-changes
```
Add a `.editorconfig` in `/backend` with C# specific rules.

### 3.4 Pre-commit hooks with Husky + lint-staged (frontend)
```bash
npm install --save-dev husky lint-staged commitlint @commitlint/config-conventional
npx husky init
```
`.husky/pre-commit`:
```sh
npx lint-staged
```
`.husky/commit-msg`:
```sh
npx commitlint --edit $1
```
`package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```
This blocks any commit that fails linting or violates commit message format. Painful to set up once, saves enormous pain forever.

---

## Phase 4 — Local Development Environment

### 4.1 Docker Compose for local services
Never ask teammates to install PostgreSQL locally. Create `docker-compose.yml` in the root:
```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: esn_dev
      POSTGRES_USER: esn
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
`docker compose up -d` — any team member has a running DB in 30 seconds.

### 4.2 Environment variables
- Create `.env.example` committed to the repo with all variable names and dummy values
- Create `.env.local` (gitignored) with real local values
- Add `.env.local` to `.gitignore` immediately — **never commit secrets**
- Document every variable in README

Backend example `.env.example`:
```
DATABASE_URL=postgresql://esn:devpassword@localhost:5432/esn_dev
JWT_SECRET=change-this-in-production
CORS_ORIGIN=http://localhost:3000
```

### 4.3 Database migrations strategy
Using EF Core:
- Never modify the database schema directly — always create a migration
- Migration naming convention: `YYYYMMDD_ShortDescription`
- Always review generated migrations before applying — EF Core sometimes generates destructive changes

```bash
dotnet ef migrations add 20240615_AddEventsTable
dotnet ef database update
```
- Add seed data for local development (sample events, sample partners)
- Document migration commands in README

---

## Phase 5 — CI/CD (GitHub Actions)

### 5.1 Backend CI pipeline
Create `.github/workflows/backend.yml`:
```yaml
name: Backend CI
on:
  pull_request:
    paths: ['backend/**']
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: esn_test
          POSTGRES_USER: esn
          POSTGRES_PASSWORD: testpassword
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.x'
      - run: dotnet restore backend/
      - run: dotnet format --verify-no-changes backend/
      - run: dotnet build backend/ --no-restore
      - run: dotnet test backend/ --no-build
```

### 5.2 Frontend CI pipeline
Create `.github/workflows/frontend.yml`:
```yaml
name: Frontend CI
on:
  pull_request:
    paths: ['frontend/**']
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci --prefix frontend
      - run: npm run lint --prefix frontend
      - run: npm test --prefix frontend -- --watchAll=false
      - run: npm run build --prefix frontend
```

### 5.3 Deployment pipeline
- `dev` branch → auto-deploy to **staging environment**
- `main` branch → auto-deploy to **production** (require manual approval step)
- Never deploy directly to production without going through staging

**This is the step most side projects skip and later regret.**

---

## Phase 6 — Testing Strategy

### 6.1 Backend
- **Unit tests:** service layer logic (business rules, data transformations)
- **Integration tests:** API endpoints against a real test database — use `WebApplicationFactory<Program>` in .NET
- Aim for integration tests on all endpoints before MVP ships
- Do not mock the database — use a real PostgreSQL container in CI

### 6.2 Frontend
- **Unit tests:** utility functions, data transformation helpers
- **Component tests:** key UI components in isolation
- **E2E tests (post-MVP):** Playwright for critical user flows

### 6.3 What to test on MVP
Minimum bar before considering MVP done:
- All API endpoints return correct status codes
- Auth flow works end-to-end
- Events listing and detail work
- Partners listing works
- App is installable as PWA (run Lighthouse audit)

---

## Phase 7 — Security Basics

These are the things that get forgotten on side projects until something goes wrong:

- **CORS** — configure explicitly on the .NET backend, whitelist only your frontend domain
- **HTTPS everywhere** — Vercel/Netlify enforce this automatically; ensure your backend host does too
- **JWT expiry** — set short access token expiry (15min), use refresh tokens
- **Input validation** — use FluentValidation on all API request DTOs
- **Dependency scanning** — enable GitHub Dependabot (Settings → Security → Dependabot) for automatic vulnerability alerts
- **No secrets in code** — enforce via pre-commit hook and periodic `git log -p | grep -i secret` audits
- **Rate limiting** — add basic rate limiting on the .NET API from day one (AspNetCoreRateLimit package)

---

## Phase 8 — Claude / AI Integration

### 8.1 CLAUDE.md (already covered in 2.2)
The most impactful thing you can do. A well-maintained `CLAUDE.md` means every Claude session starts with full project context.

### 8.2 Snippet library in Notion
Create a Notion page "Prompt Snippets" with reusable prompts for common tasks:
- "Review this .NET controller for security issues: [paste code]"
- "Write integration tests for this endpoint following our WebApplicationFactory pattern: [paste code]"
- "Generate an EF Core migration for this new entity: [paste entity class]"
- "Review this Angular component for performance issues and accessibility: [paste code]"

### 8.3 GitHub Copilot / AI in IDE
If the team uses VS Code:
- Install **GitHub Copilot** (free for verified students/open source projects — check if ESN qualifies)
- Install **Error Lens** — surfaces errors inline without opening Problems panel
- Install **GitLens** — inline blame, history per line
- Install **REST Client** — test API endpoints directly in VS Code without Postman

For JetBrains (Rider for .NET):
- **AI Assistant** is built-in
- **Conventional Commits** plugin — enforces commit message format in the IDE
- **SonarLint** — static analysis catching bugs before CI does

---

## Phase 9 — Process & Team Conventions

### 9.1 Definition of Done
A feature is done when:
- [ ] Code is reviewed and approved by at least one other person
- [ ] Tests written and passing
- [ ] CI pipeline is green
- [ ] Deployed to staging and manually verified
- [ ] Swagger docs updated (backend)
- [ ] Notion spec updated if behaviour changed
- [ ] No console errors or warnings introduced

Document this in Notion and refer to it during reviews.

### 9.2 Code review etiquette
- Reviews should happen within **24 hours** of PR opening
- Reviewers: distinguish between **blocking** ("this must change") and **non-blocking** ("nit:", "optional:") comments
- Author: do not merge on your own approval; wait for the reviewer
- Keep PRs small — aim for under 400 lines changed. Large PRs get rubber-stamped.

### 9.3 Sync cadence
Even for a side project, agree on a lightweight rhythm:
- **Weekly async update** in a group chat — what did you do, what are you doing next, any blockers
- **Monthly sync call** — review what shipped, plan next month's priorities
- Without this, "async" becomes "nothing gets done"

### 9.4 API contract first
Before writing a single line of backend code for a feature, define the API contract in Swagger/OpenAPI. Share with the frontend dev. Both sides build against the agreed contract. This prevents the "I built the API differently than you expected" blocker that kills velocity.

---

## Quick-start Checklist

Use this to track Phase completion (status as of 2026-07-07, skeleton scaffolding):

- [x] Phase 1 — Repo structure ✔ (monorepo skeleton), branch protection ✔ (GitHub rulesets), PR template ✔, issue templates ✔, GitHub Projects ✔ (Kanban set up)
- [x] Phase 2 — README ✔, CLAUDE.md ✔, ADRs ✔ (`docs/adr/`), Notion structure ✔ (see docs/meeting-summary.md)
- [ ] Phase 3 — EditorConfig ✔, ESLint ✔ (angular-eslint); Prettier config, Husky, lint-staged, commitlint still pending
- [x] Phase 4 — Docker Compose ✔, .env.example ✔, EF Core migrations workflow ✔ (pinned dotnet-ef local tool)
- [ ] Phase 5 — GitHub Actions CI ✔ (backend + frontend on PRs into dev/main); staging/production deployment pipeline pending
- [x] Phase 6 — Testing baseline ✔ (unit + WebApplicationFactory integration tests; extend per module as features land)
- [ ] Phase 7 — CORS ✔ (dev-only allowlist; prod is same-origin, ADR-002), JWT ✔ (60-min expiry, no refresh tokens yet); HTTPS enforcement, Dependabot, rate limiting pending
- [ ] Phase 8 — CLAUDE.md ✔; snippet library and IDE plugins pending
- [ ] Phase 9 — Definition of Done, review etiquette, sync cadence: pending team agreement

Note on versions: the .NET 9/.NET 8 references in this plan are superseded by the latest-stable policy — see REQUIREMENTS.md and docs/adr/001-use-latest-stable-versions.md.

---

*Last updated: 2026-07-07*
