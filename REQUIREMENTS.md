# Requirements

Version policy for this project: **everything runs on the latest stable release.** When a new major of .NET, Angular, or any dependency ships, upgrading is a chore task, not a debate. Update this file whenever versions change.

## Toolchain (what every developer needs installed)

| Tool | Required version | Notes |
|---|---|---|
| .NET SDK | **10.0.x** (latest) | https://dotnet.microsoft.com/download |
| Node.js | **24.x LTS, minimum 24.15.0** | Angular CLI 22 requires `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` |
| npm | **≥ 11** | Ships with Node 24 |
| Docker Desktop | latest, Compose v2 | Only needed for `docker compose up` / running PostgreSQL |
| Git | latest | |

No local PostgreSQL install — always use the `postgres` container (`docker compose up -d postgres`).

## Framework & package versions (currently in use)

### Backend (.NET 10)

| Package | Version |
|---|---|
| Target framework | `net10.0` |
| EF Core (+ Design) | 10.0.9 |
| Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.2 |
| ASP.NET Core Identity + JwtBearer | 10.0.9 |
| System.IdentityModel.Tokens.Jwt | 8.19.1 |
| Swashbuckle.AspNetCore | 10.2.3 |
| MediatR | 14.2.0 — note: commercially licensed since v13; free tier covers non-profits/small teams, no license key configured |
| FluentValidation | 12.1.1 |
| xunit / runner / Test SDK | 2.9.3 / 3.1.4 / 17.14.1 |
| dotnet-ef (local tool, `backend/dotnet-tools.json`) | 10.0.9 |

### Frontend (Angular 22)

| Package | Version |
|---|---|
| @angular/* (core, cli, build, etc.) | ^22.0.0 |
| @angular/material + cdk | ^22.0.0 |
| TypeScript | ~6.0.0 (Angular 22 requires >=6.0 <6.1) |
| angular-eslint | ^22.0.0 |
| vitest | ^4 |

### Infrastructure

| Component | Version |
|---|---|
| PostgreSQL (Docker image) | postgres:18 |
| Backend Docker images | mcr.microsoft.com/dotnet/sdk:10.0 → aspnet:10.0 |
| Frontend Docker images | node:24-alpine → nginx:alpine |
| CI runners | .NET 10.0.x, Node 24 (latest) |

## How to upgrade

```bash
# backend — bumps to the latest version compatible with the target framework
cd backend
dotnet add src/<Project> package <PackageName>
dotnet tool update dotnet-ef

# frontend — official migration path, run per major version
cd frontend
npx ng update @angular/cli @angular/core @angular/material angular-eslint
```

After any upgrade: `dotnet build && dotnet test` (backend), `npm run lint && npm test && npm run build` (frontend), and update the tables above.
