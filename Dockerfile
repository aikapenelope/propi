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

# Delete node_modules and reinstall from scratch to ensure native binaries
# for the current platform (linux-x64-gnu) are properly resolved.
# npm ci has a known bug with optional deps: https://github.com/npm/cli/issues/4828
RUN rm -rf node_modules && npm install --no-audit --no-fund

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

COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
