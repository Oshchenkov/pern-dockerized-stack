# =============================================================================
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
# Next.js + TypeScript + pnpm
# Stages: base → development
#                └→ builder → production
# =============================================================================
ARG NODE_VERSION=26-bookworm-slim
ARG PNPM_VERSION=11.5.2

# =============================================================================
# Stage 1: base — pnpm tooling + dependency install
# =============================================================================

FROM node:${NODE_VERSION} AS base

# Add this environment variable globally in your stage

ENV CI=true
RUN npm install -g corepack@latest && corepack enable \
    && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

WORKDIR /app/apps/client
COPY /apps/client/package.json ./

# =============================================================================
# Stage 2: development — all deps, source mounted at runtime via compose
# =============================================================================
FROM base AS development

ENV NODE_ENV=development

RUN pnpm install --frozen-lockfile 

CMD ["pnpm", "dev"]

# =============================================================================
# Stage 3: build — compiles the Next.js app, never shipped to production
# =============================================================================
FROM base AS build

ENV NODE_ENV=production

COPY /apps/client/tsconfig.json ./
COPY /apps/client/next.config.ts  ./
COPY /apps/client/src ./src
COPY /apps/client/public  ./public 
COPY /shared /app/shared

RUN pnpm install --frozen-lockfile

# Requires `output: 'standalone'` in next.config.ts
RUN pnpm build

# WORKDIR /app
# RUN pnpm deploy --legacy --filter=./apps/client /app/deploy/client
# WORKDIR /app/apps/client
# RUN pnpm deploy --prod --legacy /app/deploy/client
# =============================================================================
# Stage 4: production — only the compiled output, no source or node_modules
# =============================================================================
FROM base AS production


# Non-root user
RUN addgroup --system nodejs \
    && adduser --system --ingroup nodejs appuser

# Static public assets
COPY --from=build /app/apps/client/public ./public
# Standalone server bundle (includes only the node_modules it actually needs)
COPY --from=build --chown=appuser:nodejs /app/apps/client/.next/standalone ./
# Static build output (JS chunks, CSS, images)
COPY --from=build --chown=appuser:nodejs /app/apps/client/.next/static ./.next/static

USER appuser

# standalone output produces server.js at monorepo setup path ./app/apps/client/
CMD ["node", "./app/apps/client/server.js"]