# Build context: repository root (see docker-compose.yml)
FROM node:24-alpine AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS runtime
# The nginx image renders /etc/nginx/templates/*.template with envsubst on start.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
# Bake the release version (root VERSION file) into the template; the commit stays a runtime env var.
COPY VERSION /tmp/VERSION
RUN sed -i "s/__APP_VERSION__/$(tr -d '[:space:]' < /tmp/VERSION)/" /etc/nginx/templates/default.conf.template \
    && rm /tmp/VERSION
COPY --from=build /app/dist/esn-app/browser /usr/share/nginx/html
# Defaults suit docker compose; Render overrides both (see render.yaml).
# RENDER_GIT_COMMIT must be defined (even empty): envsubst only replaces defined variables.
ENV PORT=80 \
    API_UPSTREAM=http://backend:8080 \
    RENDER_GIT_COMMIT=""
EXPOSE 80
