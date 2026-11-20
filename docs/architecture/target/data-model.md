# Target data model (next phase, placeholder)

[Back to target index](README.md) · As-is: [data-model.md](../data-model.md) · Full design: [ADR-005 "Data model sketch"](../../adr/005-event-registration-and-payu-payments.md)

The platform phase changes **no entity**. One deploy-time setting changes: sample data is seeded only when `Seed:SampleData=true` (H1, #123, PR #136), so production gets migrations and the admin account only.

The registration and payment phase (ADR-005) adds the tables below. This page only marks what is new, changed or removed. Columns and rules live in ADR-005.

```mermaid
erDiagram
  Events ||--o{ Registrations : "NEW: has"
  Registrations ||--o| Payments : "NEW: paid by"
  Events ||--o| EventRegistrationStats : "NEW: aggregates kept after purge"
  Registrations ||--o{ RegistrationAuditEntries : "NEW: admin actions, no FK"
  Partners ||--o{ Discounts : "unchanged"

  Events {
    bool RegistrationEnabled "NEW, default false"
    timestamptz RegistrationDeadline "NEW, nullable"
    string RegistrationUrl "REMOVED (column dropped)"
    numeric Price "CHANGED use: the fee, 0 = free"
    int MaximumParticipants "CHANGED use: capacity"
    int CurrentParticipants "CHANGED: computed when registration is on"
  }
  Registrations {
    uuid Id PK "NEW table, PII, deleted 30 days after the event"
  }
  Payments {
    uuid Id PK "NEW table, PayU extOrderId"
  }
  RegistrationAuditEntries {
    uuid Id PK "NEW table, no student data"
  }
  EventRegistrationStats {
    uuid EventId PK "NEW table, counts and totals"
  }
```

Unchanged: `Partners`, `Discounts`, `InfoArticles`, `NewsItems`, `FeatureFlags`, `SiteSettings`, the Identity tables.

Open in ADR-005: whether non-PII `Payments` rows are kept for accounting (accountant's answer, #116).
