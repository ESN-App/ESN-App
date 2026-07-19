# Build context: repository root (see docker-compose.yml)
FROM node:24-alpine AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/esn-app/browser /usr/share/nginx/html
EXPOSE 80
