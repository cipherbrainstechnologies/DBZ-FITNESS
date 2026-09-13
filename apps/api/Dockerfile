# Saiyan Ascend API — Railway template (NOT deployed by default).
# Build context: monorepo root.
# Railway: leave Root Directory empty; set RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile
#   or point the service config path to /apps/api/railway.toml

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
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/domain/package.json packages/domain/
COPY packages/database/package.json packages/database/
COPY packages/providers/package.json packages/providers/
RUN pnpm install --frozen-lockfile --filter @saiyan/api...

FROM deps AS build
COPY packages/contracts packages/contracts
COPY packages/domain packages/domain
COPY packages/database packages/database
COPY packages/providers packages/providers
COPY apps/api apps/api
RUN pnpm --filter @saiyan/database generate \
  && pnpm --filter @saiyan/contracts build \
  && pnpm --filter @saiyan/domain build \
  && pnpm --filter @saiyan/database build \
  && pnpm --filter @saiyan/providers build \
  && pnpm --filter @saiyan/api build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

RUN groupadd --system --gid 1001 saiyan \
  && useradd --system --uid 1001 --gid saiyan saiyan

COPY --from=build --chown=saiyan:saiyan /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build --chown=saiyan:saiyan /app/node_modules ./node_modules
COPY --from=build --chown=saiyan:saiyan /app/apps/api ./apps/api
COPY --from=build --chown=saiyan:saiyan /app/packages ./packages

USER saiyan
EXPOSE 3001
WORKDIR /app/apps/api
# Railway injects env vars; do not rely on a baked .env file.
CMD ["node", "dist/main.js"]
