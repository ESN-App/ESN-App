# Target flows

[Back to target index](README.md)

Platform flows first. They are the scope of this version. Registration and payment flows are short placeholders at the end that link to ADR-005.

## Deploy and rollback

```mermaid
sequenceDiagram
  autonumber
  participant H as Human
  participant GH as GitHub main
  participant R as release.yml
  participant G as GHCR
  participant FW as Hetzner Cloud Firewall
  participant S as Server deploy.sh
  participant B as Off-site backup (A R2, B Storage Box)

  H->>GH: squash-merge PR with release label
  GH->>R: push to main
  R->>GH: bump VERSION, tag vX.Y.Z
  R->>G: build and push api + web, tags vX.Y.Z and sha-short
  R->>FW: hcloud add rule TCP 22 from runner IP /32
  R->>S: scp deploy files, write .env from environment production
  R->>S: ssh deploy.sh vX.Y.Z
  S->>B: backup.sh predeploy, encrypted dump
  S->>S: save running tag to previous-tag
  S->>G: compose pull
  S->>S: compose up -d --wait (healthchecks)
  R->>R: smoke test over HTTPS, /health, /, /api/version, /version.json
  alt smoke test passes
    R->>GH: job green
  else smoke test fails
    R->>S: deploy.sh previous-tag
    S->>S: compose up -d --wait with the old images
    R->>GH: job red, GitHub e-mails the committer and watchers
  end
  R->>FW: always remove the SSH rule
```

Manual rollback: run `release.yml` with `workflow_dispatch` and `tag = vX.Y.W`. If the bad release ran a destructive migration, restore the pre-deploy dump (runbook) before redeploying the older tag.

## Nightly backup

```mermaid
sequenceDiagram
  autonumber
  participant T as systemd timer 01:30 UTC
  participant S as backup.sh
  participant P as postgres container
  participant U as uploads volume
  participant O as Off-site target

  T->>S: start
  S->>P: pg_dump -Fc via compose exec -T
  P-->>S: dump stream
  S->>S: age encrypt to recipients (public key only)
  S->>O: rclone rcat db/TIMESTAMP.dump.age
  S->>U: tar the volume
  S->>S: age encrypt
  S->>O: rclone rcat uploads/TIMESTAMP.tar.age
  alt Variant A, R2
    Note over O: bucket lifecycle deletes objects after 30 days
  else Variant B, Storage Box
    S->>O: rclone delete --min-age 23d
    Note over O: daily snapshots kept 7 days, so data is gone after 30 days at most
  end
  S->>S: write last-backup marker (read by host-check)
```

## Weekly restore test

As in ADR-006 (on a GitHub runner). Gap G3 suggests running the same steps on the server instead.

```mermaid
sequenceDiagram
  autonumber
  participant C as ops-checks.yml restore-test
  participant O as Off-site target (read-only credential)
  participant DB as Throwaway postgres:18
  participant I as GitHub issues

  C->>O: list and download the newest db dump and uploads archive
  C->>C: age -d with BACKUP_AGE_IDENTITY
  C->>DB: pg_restore
  C->>DB: checks, dump age under 36 h, latest migration id, Admin user, core tables
  C->>C: list uploads archive
  alt all checks pass
    C->>C: job green, nothing kept (runner is discarded)
  else any check fails
    C->>I: open or comment issue with label ops
    I-->>I: GitHub e-mails watchers
  end
```

## Health monitoring and alerting

```mermaid
sequenceDiagram
  autonumber
  participant M as Monitor (A UptimeRobot, B uptime-check job)
  participant W as App domain via Caddy
  participant I as GitHub issues (B)
  participant V as Volunteers

  loop A every 5 min, B cron about every 15 min
    M->>W: GET /health and GET /
    W-->>M: status code
  end
  alt Variant A, failure
    M->>V: UptimeRobot e-mail (down, then up)
  else Variant B, second failure in a row
    M->>I: open ops issue "site down" (or comment on the open one)
    I-->>V: GitHub notification e-mail
  else Variant B, recovers
    M->>I: comment "recovered" and close the issue
  end
```

In B, the daily `host-check` also fails if the newest `uptime-check` run is older than 1 hour, which catches a disabled or stalled schedule within a day.

## Password-reset e-mail

The request is the existing `POST /api/auth/reset-password` flow. Only the last hop differs between the variants.

```mermaid
sequenceDiagram
  autonumber
  participant A as Admin browser
  participant API as API AuthController
  participant ES as IEmailSender
  participant BR as Brevo API (A)
  participant MB as Mailbox provider SMTP 587 (B)
  participant IN as Admin inbox

  A->>API: request reset for an e-mail address
  API->>API: Identity creates the reset token, same response whether or not the user exists
  API->>ES: SendAsync(to, subject, link to FrontendBaseUrl)
  alt Variant A, Email Provider = Brevo
    ES->>BR: HTTPS POST with API key
    BR->>IN: deliver (SPF, DKIM, DMARC of the app domain)
  else Variant B, Email Provider = Smtp
    ES->>MB: connect 587, STARTTLS, AUTH with the app password
    MB->>IN: deliver (provider's DKIM)
  else no host or key configured
    ES->>ES: log the link (development only)
  end
  A->>API: POST reset-password with token and new password
```

## Admin login

Unchanged from today, shown because it crosses the new proxy chain and ADR-005 adds a lockout and rate limit to it (#110).

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant C as Caddy
  participant N as nginx
  participant API as API
  participant DB as Postgres

  B->>C: POST /api/auth/login over HTTPS
  C->>N: XFF = client IP, X-Forwarded-Proto https
  N->>API: XFF = client, caddy and X-Proxy-Auth
  API->>API: ForwardedHeaders picks the client IP, rate limit per IP (#110)
  API->>DB: Identity checks the password, lockout counter
  API-->>B: 200 with JWT (role claim Admin) or 401
  B->>B: AuthService stores the token, isAdmin signal
```

## Next phase: registration and payments

Not designed further here. The sequences and states are in ADR-005:

| Flow | Where |
|---|---|
| Guest sign-up, PayU order, redirect, notify webhook and pull sync, 10-minute hold | [ADR-005 "Sequence: sign-up to paid"](../../adr/005-event-registration-and-payu-payments.md) and its state diagram |
| PII purge 30 days after the event, aggregate stats kept | [ADR-005 "GDPR and data retention"](../../adr/005-event-registration-and-payu-payments.md), task T6 (#114) |
| Admin cancel, bulk cancel, mark paid or refunded | ADR-005 Target design, T4 (#112), T10 (#118) |

Platform facts those flows rely on, delivered by this phase: the fixed proxy chain and subnet (for #110), no cold starts (for the 10-minute hold and PayU notify), a persistent database with backups (for #112), and the 30-day backup window (for the privacy notice).
