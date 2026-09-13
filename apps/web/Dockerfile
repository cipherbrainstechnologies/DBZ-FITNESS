# Saiyan Ascend web — Railway template (NOT deployed by default).
# Build context: monorepo root.
# Railway: leave Root Directory empty; set RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile
#   or point the service config path to /apps/web/railway.toml

ARG NODE_VERSION=22
ARG PNPM_VERSION=9.15.9

FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-tokens/package.json packages/design-tokens/
RUN pnpm install --frozen-lockfile --filter @saiyan/web...

FROM deps AS build
# Public API URL must be available at build time for Next.js client bundles.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY packages/contracts packages/contracts
COPY packages/design-tokens packages/design-tokens
COPY apps/web apps/web
RUN pnpm --filter @saiyan/contracts build \
  && pnpm --filter @saiyan/design-tokens build \
  && pnpm --filter @saiyan/web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN groupadd --system --gid 1001 saiyan \
  && useradd --system --uid 1001 --gid saiyan saiyan

COPY --from=build --chown=saiyan:saiyan /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build --chown=saiyan:saiyan /app/node_modules ./node_modules
COPY --from=build --chown=saiyan:saiyan /app/apps/web ./apps/web
COPY --from=build --chown=saiyan:saiyan /app/packages ./packages

USER saiyan
EXPOSE 3000
WORKDIR /app/apps/web
# Run Next without pnpm/corepack at runtime (non-root user cannot write ~/.cache).
CMD ["node", "scripts/start-prod.mjs"]
