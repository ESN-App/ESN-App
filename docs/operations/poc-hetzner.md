# PoC runbook: ESN app on one Hetzner server

Context: [ADR-006](../adr/006-hosting-on-hetzner-cloud.md), PoC-simplified: no own domain (`sslip.io`), sample data on, Gmail SMTP, no off-site backups, no monitoring.

Files: [deploy/docker-compose.prod.yml](../../deploy/docker-compose.prod.yml), [deploy/Caddyfile](../../deploy/Caddyfile), [deploy/.env.production.example](../../deploy/.env.production.example), [deploy/deploy.sh](../../deploy/deploy.sh), [infra/hetzner/cloud-init.yaml](../../infra/hetzner/cloud-init.yaml).

## 1. Create the server

1. Generate a deploy key pair: `ssh-keygen -t ed25519 -f esn-deploy -C deploy@esn` (the private key goes only into the GitHub secret `POC_SSH_PRIVATE_KEY`).
2. Hetzner Cloud console: new project, server type **CPX02** (1 GB; **CPX12**, 2 GB, if CPX02 cannot be created), location **HEL1**, image Ubuntu LTS, IPv4 on, backups optional (+20%).
3. In "Cloud config" paste [infra/hetzner/cloud-init.yaml](../../infra/hetzner/cloud-init.yaml) with the public key from `esn-deploy.pub` in place of the placeholder.
4. Firewall (Hetzner Cloud Firewall, attach to the server): inbound TCP 80 and 443 from anywhere, TCP 22 from your own IP only.
5. Wait for cloud-init (about 3 min): `ssh -i esn-deploy deploy@<ip> cloud-init status --wait`.
6. Your hostname is the IP with dashes: `1.2.3.4` becomes `APP_DOMAIN=1-2-3-4.sslip.io`.

## 2. Gmail sender

Use a separate Google account (not a personal one): enable 2-Step Verification, then create an app password (Google Account, Security, App passwords). It is 16 characters; put it only into `EMAIL_SMTP_PASSWORD` / the GitHub secret `SMTP_PASSWORD`. Never paste it in chat or issues. SMTP is `smtp.gmail.com:587` (STARTTLS). `EMAIL_FROM_ADDRESS` must be that Gmail address (Gmail rewrites other senders).

## 3. GitHub secrets and variables (names only)

Read by the PoC deploy workflow (PoC-2): secrets `POC_SSH_PRIVATE_KEY`, `POC_SSH_KNOWN_HOSTS`, `POSTGRES_PASSWORD`, `JWT_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SMTP_USERNAME`, `SMTP_PASSWORD`; variables `POC_HOST`, `APP_DOMAIN`, `EMAIL_FROM_ADDRESS`. Mapping to `.env`: `SMTP_USERNAME` -> `EMAIL_SMTP_USERNAME`, `SMTP_PASSWORD` -> `EMAIL_SMTP_PASSWORD`, the rest keep their names. Get known hosts with `ssh-keyscan -t ed25519 <ip>`.

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
