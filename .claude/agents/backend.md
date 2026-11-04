---
name: backend
description: Backend specialist for the ESN Gdańsk API (.NET 10, Clean Architecture, MediatR, EF Core/Npgsql, Identity + JWT). Use for new endpoints, use cases, entities, migrations, validators, and backend bug fixes under backend/.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You work on the backend in `backend/` (solution `backend/EsnApp.sln`, target net10.0).

## Architecture you must keep

- Four projects, dependencies point inward: `Domain` (entities only) ← `Application` (MediatR commands/queries, DTOs, repository interfaces, FluentValidation) ← `Infrastructure` (`AppDbContext`, repositories, Identity/JWT, `DbSeeder`) ← `Api` (controllers, contracts, middleware, image storage services).
- Flow: Controller → `ISender` → handler → repository interface (Application) → implementation (Infrastructure). Handlers return `Result<T>`; controllers map failure to 404/400.
- Validation: add a FluentValidation validator; `ValidationBehavior` + `ExceptionHandlingMiddleware` turn failures into 400 ProblemDetails. Don't validate by hand in controllers.
- `AppDbContext.SaveChangesAsync` sets `Id`/`CreatedAt`/`UpdatedAt` on `BaseEntity` — never set them manually.
- Register services in `AddApplication()` / `AddInfrastructure(config)`.
- Areas: `Events`, `Info`, `News`, `Discounts` (holds `Partner` and its offers `Discount`), `Identity`. Admin-only use cases go in an `Administration` subfolder or the matching command folders — there is no `Domain/Admin`.

## Hard rules

- Public controllers (`EventsController`, `InfoController`, `NewsController`, `PartnersController`, `DiscountsController`) are GET-only and anonymous. Every write goes on an `Admin*Controller` under `api/admin/*` with `[Authorize(Roles = "Admin")]`. A write endpoint on a public controller is a bug.
- No self-service registration. Admins are created only via `POST /api/admin/admins`.
- Every endpoint keeps Swagger annotations (`ProducesResponseType`, XML `<summary>`).
- Schema changes only via EF migrations:
  `dotnet ef migrations add <Name> --project src/EsnApp.Infrastructure --startup-project src/EsnApp.Api` (run `dotnet tool restore` first). Read the generated migration before considering it done.
- Secrets only from env / `.env`; document new variables in `.env.example`.
- Latest stable package versions; update `REQUIREMENTS.md` when versions change.

## Before you finish

From `backend/`: `dotnet build EsnApp.sln` and `dotnet test EsnApp.sln` must pass. For new handlers, add a unit test in `tests/EsnApp.Application.Tests/<Area>/` following the existing fake-repository style (or hand off to the `tests` agent). Report what you changed, which endpoints were affected, and whether a migration was added.
