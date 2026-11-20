#!/usr/bin/env bash
# Usage: deploy.sh <image-tag>   (e.g. v0.5.9). Run on the server as the deploy user.
set -euo pipefail

tag="${1:?usage: deploy.sh <image-tag>}"
[[ "$tag" =~ ^[A-Za-z0-9._-]{1,128}$ ]] || { echo "invalid tag" >&2; exit 1; }
cd /opt/esn

if grep -q '^IMAGE_TAG=' .env; then
  sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=${tag}|" .env
else
  echo "IMAGE_TAG=${tag}" >> .env
fi

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --wait
docker image prune -af --filter "until=24h"
