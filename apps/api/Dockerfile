# =============================================================================
# BASE — shared foundation (Node + pnpm + app metadata)
# =============================================================================
FROM node:26-bookworm-slim AS base

ENV PNPM_VERSION=11.9.0

# Add this environment variable globally in your stage
ENV CI=true
RUN npm install -g corepack@latest && corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

WORKDIR /app/apps/api
COPY /apps/api/package.json ./

# =============================================================================
# Stage 2: development — all deps, source mounted at runtime via compose
# =============================================================================
FROM base AS development

ENV NODE_ENV=development

# Install ALL dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source after deps so code changes don't bust the dep layer
# COPY /apps/api/tsconfig.json ./
# COPY /apps/api/src ./src


# ts-node-dev gives fast TypeScript hot-reload without a separate build step
CMD ["pnpm", "dev"]

# =============================================================================
# BUILD — compile TypeScript to JS (intermediate, not a final target)
# =============================================================================
FROM base AS build

ENV NODE_ENV=production

COPY /apps/api/tsconfig.json ./
COPY /apps/api/src ./src
COPY /shared /app/shared

RUN pnpm install --frozen-lockfile
# Compile — output lands in /app/dist
RUN pnpm run build

# Prune devDependencies so we copy only the production dep tree
# RUN pnpm deploy --prod --legacy /app/deploy/api
WORKDIR /app
RUN pnpm --legacy --filter=./apps/api deploy /app/deploy
WORKDIR /app/apps/api
# =============================================================================
# PRODUCTION — minimal, hardened image
#   Build:   docker build --target production -t express-api:prod .
#   Run:     docker run -p 3000:3000 --env-file .env express-api:prod
# =============================================================================
FROM base AS production

# Non-root user for security
RUN addgroup --system nodejs \
  && adduser --system --ingroup nodejs appuser


# Copy only what the running process needs:
#   dist/        — compiled JS
#   node_modules — pruned prod deps (no devDeps)
#   package.json — needed by some packages for metadata
COPY --from=build --chown=appuser:nodejs /app/apps/api/dist        ./dist
COPY --from=build --chown=appuser:nodejs /app/deploy/node_modules ./node_modules
# COPY --from=build --chown=appuser:nodejs /app/deploy/package.json ./package.json
# COPY --from=build /app/shared                                    /app/shared

USER appuser

CMD ["node", "dist/src/server.js"]
