# PoC runbook: ESN app on one Hetzner server

Context: [ADR-006](../adr/006-hosting-on-hetzner-cloud.md), PoC-simplified: no own domain (`sslip.io`), sample data on, Gmail SMTP, no off-site backups, no monitoring.

Files: [deploy/docker-compose.prod.yml](../../deploy/docker-compose.prod.yml), [deploy/Caddyfile](../../deploy/Caddyfile), [deploy/.env.production.example](../../deploy/.env.production.example), [deploy/deploy.sh](../../deploy/deploy.sh), [infra/tofu](../../infra/tofu/README.md) (cloud-init template `cloud-init.yaml.tftpl`).

## 1. Create the server (OpenTofu)

Everything is created by the `Infra` workflow ([infra/tofu/README.md](../../infra/tofu/README.md)): server, firewalls, primary IP, generated deploy and host keys, the `poc` environment and its secrets and variables.

1. Create environment `infra` BY HAND (required reviewer, deployment branches = `hetzner` only; GitHub auto-creates missing environments unprotected), then its secrets and variables as listed in the tofu README. Use a dedicated Hetzner project for the PoC (the token is project-wide). Passphrase: `openssl rand -hex 32`.
2. Push a change under `infra/tofu/` to `hetzner` (or run workflow `Infra` on it) and approve the `plan-apply` job.
3. `POC_HOST`, `APP_DOMAIN`, `HCLOUD_FIREWALL`, `POC_SSH_KNOWN_HOSTS` and the other secrets are already set in `poc` (the host key is generated, so no `ssh-keyscan` is needed). Wait for cloud-init (about 3 min after the first boot).
4. Add `HCLOUD_TOKEN` (it cannot read `infra` secrets) and the Gmail secrets `SMTP_USERNAME` and `SMTP_PASSWORD` to environment `poc` by hand (section 2), then run workflow `PoC deploy`. `poc` has the reviewers from `POC_REVIEWER_USER_IDS`: the deploy key is root-equivalent.

Fallback without tofu (Hetzner console): server type CPX02 (CPX12 if unavailable), HEL1, Ubuntu 24.04, cloud-init from the template with the placeholders filled by hand, firewall with TCP 80/443 open and 22 from your IP, then set the `poc` secrets and variables by hand. The hostname is the IP with dashes (`1.2.3.4` becomes `1-2-3-4.sslip.io`); get known hosts with `ssh-keyscan -t ed25519 <ip>` and verify the fingerprint in the console.

## 2. Gmail sender

Use a separate Google account (not a personal one): enable 2-Step Verification, then create an app password (Google Account, Security, App passwords). It is 16 characters; put it only into `EMAIL_SMTP_PASSWORD` / the GitHub secret `SMTP_PASSWORD`. Never paste it in chat or issues. SMTP is `smtp.gmail.com:587` (STARTTLS). `EMAIL_FROM_ADDRESS` must be that Gmail address (Gmail rewrites other senders).

## 3. GitHub secrets and variables (names only)

Created by tofu in `poc`: secrets `POC_SSH_PRIVATE_KEY`, `POC_SSH_KNOWN_HOSTS`, `POSTGRES_PASSWORD`, `JWT_KEY`, `SEED_ADMIN_PASSWORD`; variables `POC_HOST`, `APP_DOMAIN`, `HCLOUD_FIREWALL` (the `ssh_ci` firewall), `SEED_ADMIN_EMAIL`, `EMAIL_FROM_ADDRESS`. By hand in `poc`: `HCLOUD_TOKEN`, `SMTP_USERNAME`, `SMTP_PASSWORD`. Mapping to `.env`: `SMTP_USERNAME` -> `EMAIL_SMTP_USERNAME`, `SMTP_PASSWORD` -> `EMAIL_SMTP_PASSWORD` (names compose reads), the rest keep their names. Login as the owner: `ssh deploy@<ip>` with your personal key (root login is off). The seed admin password is stored only as a secret (write-only in the UI); to learn or change it, log in and reset it through the app.

## 4. First manual deploy

```bash
scp deploy/docker-compose.prod.yml deploy/Caddyfile deploy/deploy.sh deploy@<ip>:/opt/esn/
scp deploy/.env.production.example deploy@<ip>:/opt/esn/.env   # then edit it on the server
ssh deploy@<ip> 'chmod 600 /opt/esn/.env && nano /opt/esn/.env'
ssh deploy@<ip> '/opt/esn/deploy.sh v0.5.9'                     # any published image tag
```

Redeploy or roll back = the same last command with another tag. GHCR images must be public (no login on the server). Open `https://<APP_DOMAIN>`: Caddy gets the certificate on the first request (Let's Encrypt, falls back to ZeroSSL).

Notes until their PRs are merged: `Seed__SampleData` (#136, sample data is currently always seeded), `GIT_COMMIT` (#138, the API still reads `RENDER_GIT_COMMIT`, which compose also sets), nginx `X-Forwarded-Proto` (#139).

## 5. Check memory

```bash
docker stats --no-stream
free -m
docker compose -f /opt/esn/docker-compose.prod.yml ps
```

Limits: api 400 MB (GC heap cap 300 MB), postgres 256 MB, web and caddy 64 MB each, 2 GB swap. Local measurement after a restart, idle: api ~80 MB, postgres ~24 MB, caddy ~17 MB, web ~8 MB. Upgrade to CPX12 if swap is in use for long or `dmesg | grep -i oom` shows kills.

## 6. PoC success criteria

- `https://<APP_DOMAIN>` loads with a valid certificate; `/health` returns 200 (includes the database).
- Admin login works and the admin panel is usable.
- An uploaded image survives `deploy.sh <tag>` (volume `uploads`).
- Password-reset email from Gmail arrives and the link (`https://<APP_DOMAIN>/auth/reset-password...`) works.
- `docker stats` stays within the limits; no OOM kills.
- Redeploy is one command.
