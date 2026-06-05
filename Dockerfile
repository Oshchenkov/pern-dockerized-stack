# =========================================================
# STAGE 1: Build Environment Setup (with NVM, PNPM, and YARN)
# =========================================================
FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install system dependencies required for NVM, Python, and native builds
RUN apt-get update && apt-get install -y \
    curl \
    git \
    bash \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Fix: Force Docker to use Bash shell so NVM commands can be sourced properly
SHELL ["/bin/sh", "-c"]
RUN rm /bin/sh && ln -s /bin/bash /bin/sh


# Install NVM (Node Version Manager)
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=v20.11.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm use $NODE_VERSION \
    && nvm alias default $NODE_VERSION

# Expose NVM and its specific Node paths globally into the system PATH environment
ENV PATH=$NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

# Enable Corepack to manage and install global instances of Yarn and PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate && corepack prepare yarn@stable --activate

# =========================================================
# STAGE 2: NEW Development Environment Target
# =========================================================
FROM base AS development
WORKDIR /app

# Expose port 3000 for local development server access
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Automatically run install and launch the custom framework dev server script
CMD ["sh", "-c", "if [ -f pnpm-lock.yaml ]; then pnpm install && pnpm run dev; elif [ -f yarn.lock ]; then yarn install && yarn dev; else npm install && npm run dev; fi"]

# =========================================================
# STAGE 3: Dependency Installer & Builder (For Production Only)
# =========================================================
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yam[l] yarn.loc[k] package-lock.jso[n] ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; \
    fi

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f yarn.lock ]; then yarn build; \
    else npm run build; \
    fi

# =========================================================
# STAGE 4: Final Highly-Optimized Production Runner
# =========================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
