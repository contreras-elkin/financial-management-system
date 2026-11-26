# syntax=docker/dockerfile:1

# ---------- Stage 1: build (Node + Vite) ----------
FROM node:22-alpine AS build
WORKDIR /app

# Manifests first: this layer only changes when the dependencies change
COPY package.json package-lock.json ./
# npm ci installs exactly what package-lock.json says; the cache mount keeps ~/.npm between builds
RUN --mount=type=cache,target=/root/.npm npm ci

# Source code
COPY . .
RUN npm run build

# ---------- Stage 2: runtime (nginx as a non-root user) ----------
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
