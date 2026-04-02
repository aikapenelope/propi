# Based on official Next.js Dockerfile:
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
#
# Uses `npm install` instead of `npm ci` to work around npm/cli#4828 where
# native optional binaries (lightningcss, @tailwindcss/oxide) are silently
# skipped by `npm ci` in Docker builds.

ARG NODE_VERSION=22-slim

# ============================================
# Stage 1: Build
# ============================================
FROM node:${NODE_VERSION} AS builder

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Delete lockfile and reinstall from scratch so npm resolves native binaries
# for the current platform (linux-x64-gnu). The lockfile was generated on
# macOS/different arch and only contains darwin binaries.
# See: https://github.com/npm/cli/issues/4828
RUN rm -rf node_modules package-lock.json && npm install --no-audit --no-fund

# Copy source
COPY . .

# Build arguments for NEXT_PUBLIC_ env vars (embedded in client JS at build time)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================
# Stage 2: Run
# ============================================
FROM node:${NODE_VERSION} AS runner

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Drizzle: schema + config + drizzle-kit for automatic schema sync on deploy.
# entrypoint.sh runs `drizzle-kit push` before starting the app.
COPY --from=builder --chown=node:node /app/src/server/schema.ts ./src/server/schema.ts
COPY --from=builder --chown=node:node /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=node:node /app/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --from=builder --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=node:node /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=node:node /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder --chown=node:node /app/node_modules/@esbuild-kit ./node_modules/@esbuild-kit
COPY --from=builder --chown=node:node /app/node_modules/get-tsconfig ./node_modules/get-tsconfig

# Entrypoint: sync schema then start server
COPY --chown=node:node entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

USER node

EXPOSE 3000

CMD ["./entrypoint.sh"]
