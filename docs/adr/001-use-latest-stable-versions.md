# ADR-001: Always use the latest stable versions

## Status

Accepted (2026-07-07). Supersedes the ".NET 8" pin in [architecture-decisions.md](../architecture-decisions.md) and the skeleton prompt.

## Context

The Init/Kickoff meetings fixed the stack (.NET, Angular, PostgreSQL) but the skeleton spec pinned .NET 8 while .NET 10 and Angular 22 were already the current stable releases. Staying on old majors from day one means a large forced upgrade later; the project has no legacy constraints.

## Decision

Every framework, package, and infrastructure component runs on its **latest stable release**, and upgrades are routine chores. Current versions are tracked in [REQUIREMENTS.md](../../REQUIREMENTS.md), which is the source of truth over any version mentioned in older docs.

As of this ADR: .NET 10 / EF Core 10, Angular 22 + TypeScript 6, PostgreSQL 18, Node 24 LTS.

## Consequences

- Developers need current toolchains: .NET SDK 10.0.x and Node ≥ 24.15 (Angular CLI 22 hard-fails on older Node).
- Swashbuckle 10 pulled in Microsoft.OpenApi 2.x (new namespace + security-requirement API in `Program.cs`).
- MediatR resolved to v14, which is commercially licensed (free tier applies to a non-profit; no license key configured).
- CI and Dockerfiles must be bumped together with the projects (done: `sdk:10.0`/`aspnet:10.0`, `node:24-alpine`, `postgres:18`, `dotnet-version: 10.0.x`).
- When a new major ships, run the upgrade commands in REQUIREMENTS.md, fix breakages, and update its version tables.
