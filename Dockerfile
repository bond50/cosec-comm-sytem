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

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

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

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ARG GIT_SHA
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV DATABASE_URL=${DATABASE_URL}
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

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
