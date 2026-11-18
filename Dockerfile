# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:24-bookworm-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PNPM_CONFIG_IGNORE_SCRIPTS=false
ENV CI=true

# Build needs only a PLACEHOLDER (Prisma code generation). Never pass the real DATABASE_URL here:
# build arguments can be recorded with the image. The real one is a runtime setting.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile


# ---- builder ----
FROM node:24-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PNPM_CONFIG_IGNORE_SCRIPTS=false
ENV CI=true

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG GIT_SHA
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV GIT_SHA=${GIT_SHA}
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts
COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm build


# ---- runner ----
FROM node:24-bookworm-slim AS runner
WORKDIR /app

# npm is not used at runtime; removing it also drops its bundled dependencies from scans.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Unprivileged runtime user (siscom runs the container as 10001:10001)
RUN groupadd --system --gid 10001 app   && useradd --system --uid 10001 --gid 10001 --home-dir /app --no-create-home --shell /usr/sbin/nologin app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=10001:10001 /app/.next/standalone ./
COPY --from=builder --chown=10001:10001 /app/.next/static ./.next/static
COPY --from=builder --chown=10001:10001 /app/public ./public

# Next writes its image cache here
RUN mkdir -p .next/cache && chown 10001:10001 .next/cache

EXPOSE 3000

USER 10001:10001

CMD ["node", "server.js"]
