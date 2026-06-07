# =============================================================================
# BASE — shared foundation (Node + pnpm + app metadata)
# =============================================================================
FROM node:26-bookworm-slim AS base


ENV PORT=4000
# Add this environment variable globally in your stage
ENV CI=true
ENV PNPM_VERSION=11.5.2
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# Copy manifests first — best-practice layer cache for deps
COPY package.json pnpm-lock.yaml ./

# =============================================================================
# DEVELOPMENT — hot-reload dev server
#   Build:   docker build --target development -t express-api:dev .
#   Run:     docker run -p 3000:3000 --env-file .env \
#              -v $(pwd)/src:/app/src express-api:dev
# =============================================================================
FROM base AS development

ENV NODE_ENV=development

# Install ALL dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source after deps so code changes don't bust the dep layer
COPY tsconfig.json ./
COPY src ./src

EXPOSE ${PORT}

# ts-node-dev gives fast TypeScript hot-reload without a separate build step
CMD ["pnpm", "dev"]

# =============================================================================
# BUILD — compile TypeScript to JS (intermediate, not a final target)
# =============================================================================
FROM base AS build

ENV NODE_ENV=production

# Install all deps (need devDeps for tsc)
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

# Compile — output lands in /app/dist
RUN pnpm run build

# Prune devDependencies so we copy only the production dep tree
RUN pnpm prune --prod

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
COPY --from=build --chown=appuser:nodejs /app/dist        ./dist
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

EXPOSE ${PORT}

# Healthcheck so orchestrators (Docker Compose / K8s) can probe readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
