# =============================================================================
# Next.js + TypeScript + pnpm
# Stages: base → development
#                └→ builder → production
#
# 
# docker build --target development -t next-js-client:development .
# docker run -p 3000:3000 \     
#   -v "$(pwd)":/app \
#   -v /app/node_modules \
#   -v /app/.next \
#   next-js-client:development
#
# docker build --target production -t next-js-client:production .
# docker run -p 3000:3000 next-js-client:production
# =============================================================================
 
# -----------------------------------------------------------------------------
# Stage 1: base — pnpm tooling + dependency install
# -----------------------------------------------------------------------------
FROM node:26-bookworm-slim AS base
 
# Add this environment variable globally in your stage
ENV PORT=3000
ENV CI=true
ENV PNPM_VERSION=11.5.2
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
 
WORKDIR /app
 
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
 
# -----------------------------------------------------------------------------
# Stage 2: development — all deps, source mounted at runtime via compose
# -----------------------------------------------------------------------------
FROM base AS development
 
RUN pnpm install --frozen-lockfile 
 
EXPOSE ${PORT}
CMD ["pnpm", "dev"]
 
# -----------------------------------------------------------------------------
# Stage 3: builder — compiles the Next.js app, never shipped to production
# -----------------------------------------------------------------------------
FROM base AS builder

ENV NODE_ENV=production
 
RUN pnpm install --frozen-lockfile
# Prune devDependencies so we copy only the production dep tree
RUN pnpm prune --prod
 
COPY . .
 
# Requires `output: 'standalone'` in next.config.ts
RUN pnpm build
 
# -----------------------------------------------------------------------------
# Stage 4: production — only the compiled output, no source or node_modules
# -----------------------------------------------------------------------------
FROM base AS production


# Non-root user
RUN addgroup --system nodejs \
 && adduser --system --ingroup nodejs appuser
 
# Static public assets
COPY --from=builder /app/public ./public
 
# Standalone server bundle (includes only the node_modules it actually needs)
COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
 
# Static build output (JS chunks, CSS, images)
COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static
 
USER appuser
 
EXPOSE ${PORT}
ENV HOSTNAME="0.0.0.0"
 
# standalone output produces server.js at the root
CMD ["node", "server.js"]