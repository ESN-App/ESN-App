# ESN Gdańsk App: target architecture (to-be)

[As-is architecture](../README.md) · Decisions: [ADR-005](../../adr/005-event-registration-and-payu-payments.md) (registration + PayU, Accepted, PR #109), [ADR-006](../../adr/006-hosting-on-hetzner-cloud.md) (Hetzner, Accepted, PR #122) · Research: [hosting](../../research/hosting.md) (PR #122), [payments](../../research/payments.md)

This folder is the **single picture of where the system is going**. ADRs record why, issues record the work, and this folder shows how the pieces fit once they are done. It links to the as-is docs and the ADRs instead of repeating them. Dated 2026-11-20, based on `main` at v0.5.9. Links to ADR-005/006 and the hosting research resolve once PRs #109 and #122 are merged.

**Scope of this version: the platform** (hosting, delivery, backups, monitoring, e-mail). Registration and payments (ADR-005) are the **next phase** and appear only as placeholders ([data-model.md](data-model.md), [flows.md](flows.md#next-phase-registration-and-payments)).

## Two dependency variants

The owner finds the ADR-006 setup has too many external services. Both variants run **the same application on the same server** (starts on CPX02, 1 GB; upgrade to CPX12 before #112). They differ only in who stores the off-site backups, who sends e-mail, who hosts DNS and who watches uptime.

| | Variant A: full (ADR-006 as written) | Variant B: minimal |
|---|---|---|
| Off-site backups | Cloudflare R2 (free tier) | Hetzner Storage Box BX11 in FSN1 (a different site from the HEL1 server) |
| E-mail | Brevo HTTP API (PR #137) | Association's existing mailbox over SMTP 587 + STARTTLS (existing `SmtpEmailSender`, no code) |
| DNS | Cloudflare (moved from the registrar) | Stays at the existing registrar |
| Uptime monitoring | UptimeRobot (every 5 min) | Scheduled GitHub Actions job (about every 15 min) that opens an `ops` issue |
| Accounts to run | 6 (Hetzner, GitHub, registrar, Cloudflare, Brevo, UptimeRobot) | 4, and the registrar and mailbox already exist |
| Cost per month, gross (est.) | **≈ €8.11 (≈ 34 PLN)** on CPX02; €14.75 (≈ 63 PLN) after the CPX12 upgrade | **≈ €12.04 (≈ 51 PLN)** on CPX02; €18.68 (≈ 79 PLN) after the CPX12 upgrade |

Details, costs and trade-offs are in [system.md](system.md#dependency-comparison). What B changes in the tasks is in [roadmap.md](roadmap.md#what-changes-if-variant-b-is-chosen).

**Architect's recommendation: Variant B**, with two exit ramps:

- add Brevo (A's e-mail part, PR #137 is ready) if the mailbox cannot send over 587 with a dedicated account and an app password, or if its daily cap is below about 200 messages;
- add UptimeRobot if an outage goes unnoticed for more than an hour.

B costs about €4/month more, but it halves the number of accounts a volunteer team must own, secure and hand over, and it removes two GDPR sub-processors. **The owner decides.** The choice is recorded in a follow-up ADR that amends ADR-006 (not in this PR).

## Goals

- No cold starts, persistent Postgres and uploads, working e-mail (closes #24, #25, #26).
- Reproducible, image-based deploys from `main` with a smoke test and automatic rollback. The ADR-004 branch rules stay.
- Encrypted off-site backups, a restore tested by CI every week, and retention that keeps the ADR-005 promise: personal data is gone from backups at most 30 days after it is deleted in the app.
- A known proxy chain (Caddy → nginx → API), so ADR-005 can trust `X-Forwarded-For` and rate-limit per IP.
- Everything an operator needs lives in the repo (compose, scripts, workflows, runbook), not in someone's head or a vendor UI.

## Non-goals

- High availability, more than one server, Kubernetes, Terraform, or a PaaS layer such as Coolify. ADR-006 rejected these for this load (about 1,000 visits/day, 5,000 at peaks).
- Data migration from Render: production holds only mock data.
- A CDN or the Cloudflare proxy in front of the app. This is possible later under the conditions in [research section 7](../../research/hosting.md).

## Deliberately later

| Item | Where |
|---|---|
| Event registration and PayU payments | ADR-005, #105, #106 (next phase, see [roadmap.md](roadmap.md)) |
| Student accounts | #22 |
| Notifications (events, registrations) | #22 |
| Configurable per-event form fields | ADR-005 "Out of scope" |
| PayU refunds API (`RefundPending`) | ADR-005 step 13 |
| Staging environment (reconsider Terraform at that point) | ADR-006 section 3 |
| Admin statistics | #99 (reads `EventRegistrationStats` once ADR-005 ships) |

## Index

| Document | Contents |
|---|---|
| [system.md](system.md) | C4 context and containers for Variants A and B, dependency comparison (cost, limits, account owner, GDPR) |
| [deployment.md](deployment.md) | Hetzner VM, network and firewall, proxy chain, secrets, CI/CD pipeline, backup and restore, monitoring, e-mail path |
| [flows.md](flows.md) | Sequences: deploy and rollback, nightly backup and weekly restore test, password-reset e-mail (A and B), health alerting, admin login; registration/payment placeholders |
| [data-model.md](data-model.md) | Placeholder: entity changes from ADR-005 (next phase) |
| [roadmap.md](roadmap.md) | Phases, task dependency graph (H1–H12, #135, ADR-005 tasks), critical path, owner actions, per-variant changes |

## Gaps and inconsistencies

Found while drawing the target. None is fixed here (this PR does not edit ADRs). Each needs a decision or a small follow-up.

| # | Where | Gap | Suggested fix |
|---|---|---|---|
| G1 | ADR-006 Status and Refs | It calls ADR-005 "proposed", but ADR-005 is Accepted (2026-11-20). | Update the reference when either PR merges. |
| G2 | ADR-005 steps 1 and 12 | Step 1 is "Paid Postgres + backups" on Render (#26), and step 12 puts the PayU production keys "in Render". ADR-006 replaces both with Hetzner (H5, H7, H9, H11) and the GitHub Environment `production`. | Amend the ADR-005 plan: step 1 = ADR-006 H11, and step 12 stores its secrets in the `production` environment. |
| G3 | ADR-006 restore test | The weekly restore test decrypts the dump on a **GitHub-hosted runner**, so GitHub processes student PII once ADR-005 ships. ADR-006 P3 lists Hetzner, Brevo and Cloudflare as sub-processors, but not GitHub. This applies to both variants. | Either list GitHub as a sub-processor, or run the restore into a throwaway `postgres:18` container on the server and send only the check results to Actions. Recommended: the second, so no PII leaves Hetzner. |
| G4 | `/health` | `MapHealthChecks("/health")` has no DB check ([Program.cs](../../../backend/src/EsnApp.Api/Program.cs)). The smoke test, the uptime monitor and `compose up --wait` all pass while Postgres is down. | Add the EF Core DbContext health check (or a `/health/ready` endpoint that includes it) and point the smoke test and the monitor at it. |
| G5 | Integration branch `hetzner` | Issues #123–#134 land on a long-lived `hetzner` branch (PRs #136–#139) and reach `main` in one PR. CLAUDE.md and ADR-004 say one branch + one PR into `main` per change, with no stacking. | Record the exception (in the amending ADR or in CLAUDE.md), or retarget the PRs to `main`. The final merge must carry the highest bump of its parts (`release:minor`, from #137, in Variant A). |
| G6 | Backup retention | ADR-005 Context says backups may hold PII "for 14–30 days more". ADR-006 settles on 30 days (R2) + 7 days (server backups). In Variant B, Storage Box snapshots add their own retention on top of file pruning. | Use one number in both ADRs: **30 days at most**. In B: prune files older than 23 days, and keep daily snapshots for 7 days, which totals 30. |
| G7 | Turnstile (ADR-005) | The `registrationCaptcha` flag uses Cloudflare Turnstile. In Variant B, turning it on brings back a Cloudflare account and a sub-processor. | Accept it as "only if bots appear", or rely on the checks that need no vendor (honeypot, hold cap, rate limits). |
| G8 | Mailbox SMTP and PII (Variant B, with ADR-005) | Mail sent through a real mailbox is usually kept in its Sent folder. Once confirmation e-mails exist, that folder keeps student names and e-mail addresses past the 30-day purge. | Use a dedicated sending account that does not save sent mail, or one with a 30-day auto-delete rule, and say so in the privacy notice. |
| G9 | `SmtpEmailSender` | It always connects with `StartTls` ([SmtpEmailSender.cs](../../../backend/src/EsnApp.Infrastructure/Identity/SmtpEmailSender.cs)), so port 465 (implicit TLS) would fail, and Hetzner blocks 465 anyway. | B needs a provider that accepts submission on **587 + STARTTLS**. Owner action P6-B checks this. |
| G10 | Scheduled workflows | In a public repo, GitHub disables schedules after 60 days without activity, and it may delay or drop scheduled runs under load. ADR-006 uses schedules for the restore test and host check, and Variant B also uses them for uptime. | The monthly check stays in P2. In B, the uptime job alerts only after 2 failed runs in a row, and a run that goes missing is caught by the daily host check. |
| G11 | ADR-006 secrets list | It lists only `BREVO_API_KEY` and `R2_*`. There are no `EMAIL_SMTP_*` and no Storage Box secrets. | See the per-variant list in [deployment.md](deployment.md#secrets). |
