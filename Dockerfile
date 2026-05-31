# syntax=docker/dockerfile:1

# --- builder: install all deps and build the app ---
FROM oven/bun:1.3.11 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# --- prod-deps: production-only node_modules ---
# Resolved explicitly here because Bun auto-install in the runtime image does
# not resolve peer/optional-peer deps (kysely, better-call) correctly.
FROM oven/bun:1.3.11 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- runner: minimal runtime image ---
FROM oven/bun:1.3.11-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY package.json server.js ./
COPY src/server ./src/server

EXPOSE 3000

# Run migrations on boot, then start the server. Railway injects PORT.
CMD ["sh", "-c", "bun run db:migrate:prod && bun run ./server.js"]
