# =============================================================================

# =============================================================================
ARG NODE_VERSION=26-bookworm-slim
ARG PNPM_VERSION=11.5.2
ARG APPS_PATH=apps/admin
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

WORKDIR /app/apps/admin
COPY /apps/admin/package.json ./

# =============================================================================
# Stage 2: development — all deps, source mounted at runtime via compose
# =============================================================================
FROM base AS development

ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile 

# CMD ["pnpm", "dev"] - it runs from docker compose

# =============================================================================
# Stage 3: build 
# =============================================================================
# FROM base AS build

# # ENV NODE_ENV=production

# COPY /apps/client/tsconfig.json ./
# COPY /apps/client/postcss.config.mjs ./
# COPY /apps/client/next.config.ts  ./
# COPY /apps/client/src ./src
# COPY /apps/client/public  ./public 
# COPY /shared /app/shared

# RUN pnpm install --frozen-lockfile

# # Requires `output: 'standalone'` in next.config.ts
# RUN pnpm build

# =============================================================================
# Stage 4: production — only the compiled output
# =============================================================================
# FROM base AS production


# # Non-root user
# RUN addgroup --system nodejs \
#     && adduser --system --ingroup nodejs appuser

# # Static public assets
# COPY --from=build /app/apps/client/public ./apps/client/public
# COPY --from=build --chown=appuser:nodejs /app/apps/client/.next/standalone ./
# COPY --from=build --chown=appuser:nodejs /app/apps/client/.next/static ./apps/client/.next/static

# USER appuser

# # standalone output produces server.js at monorepo setup path ./apps/client/
# CMD ["node", "./apps/client/server.js"]