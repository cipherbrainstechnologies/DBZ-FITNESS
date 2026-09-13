# Saiyan Ascend worker — Railway template (NOT deployed by default).
# Build context: monorepo root.
# Railway: leave Root Directory empty; set RAILWAY_DOCKERFILE_PATH=apps/worker/Dockerfile
#   or point the service config path to /apps/worker/railway.toml
# Do not expose a public HTTP port for this service.

ARG NODE_VERSION=22
ARG PNPM_VERSION=9.15.9

FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/database/package.json packages/database/
COPY packages/domain/package.json packages/domain/
RUN pnpm install --frozen-lockfile --filter @saiyan/worker...

FROM deps AS build
COPY packages/database packages/database
COPY packages/domain packages/domain
COPY apps/worker apps/worker
RUN pnpm --filter @saiyan/database generate \
  && pnpm --filter @saiyan/domain build \
  && pnpm --filter @saiyan/database build \
  && pnpm --filter @saiyan/worker build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 1001 saiyan \
  && useradd --system --uid 1001 --gid saiyan saiyan

COPY --from=build --chown=saiyan:saiyan /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build --chown=saiyan:saiyan /app/node_modules ./node_modules
COPY --from=build --chown=saiyan:saiyan /app/apps/worker ./apps/worker
COPY --from=build --chown=saiyan:saiyan /app/packages ./packages

USER saiyan
WORKDIR /app/apps/worker
CMD ["node", "dist/main.js"]
