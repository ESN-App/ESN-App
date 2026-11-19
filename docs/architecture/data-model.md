# Data model

[Back to index](README.md) · Sources: [Domain](../../backend/src/EsnApp.Domain), [AppDbContext](../../backend/src/EsnApp.Infrastructure/Persistence/AppDbContext.cs), [Configurations/](../../backend/src/EsnApp.Infrastructure/Persistence/Configurations), [model snapshot](../../backend/src/EsnApp.Infrastructure/Persistence/Migrations/AppDbContextModelSnapshot.cs)

## ER diagram

```mermaid
erDiagram
  Partners ||--o{ Discounts : "has offers (cascade delete)"
  AspNetUsers ||--o{ AspNetUserRoles : "has roles"
  AspNetRoles ||--o{ AspNetUserRoles : "assigned"

  Events {
    uuid Id PK
    string Title "200, required"
    string ShortDescription "500, required"
    text Description "required"
    string Location "500, required"
    string GoogleMapsUrl "2000, nullable"
    timestamptz StartsAt "required"
    timestamptz EndsAt "nullable"
    string ImagePath "2000, nullable"
    string RegistrationUrl "2000, nullable"
    int Status "EventStatus"
    timestamptz PublishedAt "nullable"
    int MinimumParticipants "nullable"
    int MaximumParticipants "nullable"
    int CurrentParticipants "nullable"
    numeric Price "10,2"
    string CreatedBy_UpdatedBy "id 450 / name 120 snapshots"
    timestamptz CreatedAt
    timestamptz UpdatedAt "nullable"
  }

  Partners {
    uuid Id PK
    string Name "200, required"
    string ShortDescription "500, required"
    text Description "required"
    string LogoPath "2000, required"
    string Address "500, nullable"
    string WebsiteUrl "2000, nullable"
    string GoogleMapsUrl "2000, nullable"
    numeric Latitude "9,6, nullable"
    numeric Longitude "9,6, nullable"
    int Status "PartnerStatus"
    int DisplayOrder
    string CreatedBy_UpdatedBy "snapshots"
    timestamptz CreatedAt
    timestamptz UpdatedAt "nullable"
  }

  Discounts {
    uuid Id PK
    uuid PartnerId FK
    string Title "200"
    text Description
    timestamptz CreatedAt
    timestamptz UpdatedAt "nullable"
  }

  InfoArticles {
    uuid Id PK
    string Title "200, required"
    string Slug "200, unique"
    text Content "required"
    string Category "100, required"
    string ImagePath "2000, nullable"
    text_array ExternalLinks "text[]"
    int DisplayOrder
    int Status "InfoArticleStatus"
    string CreatedBy_UpdatedBy "snapshots"
    timestamptz CreatedAt
    timestamptz UpdatedAt "nullable"
  }

  NewsItems {
    uuid Id PK
    string Title "200, required"
    string Description "2000, required"
    string ImagePath "2000, nullable"
    int DisplayOrder
    int Status "NewsItemStatus"
    string CreatedBy_UpdatedBy "snapshots"
    timestamptz CreatedAt
    timestamptz UpdatedAt "nullable"
  }

  FeatureFlags {
    string Key PK "100"
    bool Enabled
    timestamptz UpdatedAt
  }

  SiteSettings {
    string Key PK "100"
    string Value "500"
    timestamptz UpdatedAt
  }

  AspNetUsers {
    string Id PK
    string Email "unique (RequireUniqueEmail)"
    string FirstName "50"
    string LastName "50"
    timestamptz CreatedAt "default CURRENT_TIMESTAMP"
  }

  AspNetRoles {
    string Id PK
    string Name "Admin"
  }

  AspNetUserRoles {
    string UserId FK
    string RoleId FK
  }
```

`CreatedBy_UpdatedBy` stands for four columns: `CreatedById`, `CreatedByName`, `UpdatedById` and `UpdatedByName`. They are **deliberately not foreign keys** to `AspNetUsers` (see [backend.md, Audit fields](backend.md#audit-fields)). The other Identity tables (`AspNetUserClaims`, `AspNetUserLogins`, `AspNetUserTokens`, `AspNetRoleClaims`) exist but the app does not use them directly.

## Base classes

| Class | Fields | Used by |
|---|---|---|
| [`BaseEntity`](../../backend/src/EsnApp.Domain/Common/BaseEntity.cs) | `Id` (Guid), `CreatedAt`, `UpdatedAt?` | `Discount` |
| [`CreatorTrackedEntity`](../../backend/src/EsnApp.Domain/Common/CreatorTrackedEntity.cs) : `BaseEntity` | + `CreatedById/Name`, `UpdatedById/Name` | `Event`, `Partner`, `InfoArticle`, `NewsItem` |
| (none, key = identity) | `Key`, `UpdatedAt` | `FeatureFlag`, `SiteSetting` |

## Status enums (stored as int)

| Enum | Values | Public visibility |
|---|---|---|
| [`EventStatus`](../../backend/src/EsnApp.Domain/Events/EventStatus.cs) | Draft 0, Published 1, Cancelled 2, Completed 3, Archived 4 | Published + Cancelled |
| [`PartnerStatus`](../../backend/src/EsnApp.Domain/Discounts/PartnerStatus.cs) | Draft 0, Active 1, Inactive 2 | Active (their offers too) |
| [`InfoArticleStatus`](../../backend/src/EsnApp.Domain/Info/InfoArticleStatus.cs) | Draft 0, Published 1 | Published |
| [`NewsItemStatus`](../../backend/src/EsnApp.Domain/News/NewsItemStatus.cs) | Draft 0, Published 1 | Published |

## Indexes

- `Events (Status, StartsAt)`
- `Partners (Status, DisplayOrder)`
- `InfoArticles (Slug)` unique; `InfoArticles (Status, Category, DisplayOrder)`
- `NewsItems (Status, DisplayOrder)`
- `Discounts (PartnerId)` (FK)

## Conventions

- `Uri` properties (`GoogleMapsUrl`, `WebsiteUrl`) are stored as strings through a value converter.
- All instants are `DateTimeOffset` (stored as `timestamptz`, UTC). Converting to the site time zone happens only in the frontend.
- The schema changes **only** through EF Core migrations in [Persistence/Migrations](../../backend/src/EsnApp.Infrastructure/Persistence/Migrations) (20 so far, from `InitialCreate` 2026-07-07 to `AddSiteSettings` 2026-11-08). [`DbSeeder.SeedAsync`](../../backend/src/EsnApp.Infrastructure/Persistence/DbSeeder.cs) calls `Database.MigrateAsync()` and then seeds the role, the admin and sample events/partners/news/info articles (info inline in the seeder) from [EventSeedData](../../backend/src/EsnApp.Infrastructure/Persistence/EventSeedData.cs), [PartnerSeedData](../../backend/src/EsnApp.Infrastructure/Persistence/PartnerSeedData.cs) and [NewsSeedData](../../backend/src/EsnApp.Infrastructure/Persistence/NewsSeedData.cs). Feature-flag and site-setting rows are seeded inside their migrations instead.
- The design-time factory for `dotnet ef` is [AppDbContextFactory](../../backend/src/EsnApp.Infrastructure/Persistence/AppDbContextFactory.cs).
