# =============================================================================
# LawLens Public Frontend - Production Dockerfile
# =============================================================================
# Multi-stage build for Next.js 16 application
# Build context: monorepo root (docker build -f frontend-public/Dockerfile .)
# Port: 3001
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy package.json files for all workspaces
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/config/package.json ./packages/config/
COPY packages/hooks/package.json ./packages/hooks/
COPY frontend-public/package.json ./frontend-public/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# Copy dependencies from deps stage (full pnpm store structure)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/api-client/node_modules ./packages/api-client/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/packages/hooks/node_modules ./packages/hooks/node_modules
COPY --from=deps /app/frontend-public/node_modules ./frontend-public/node_modules

# Copy source files
COPY package.json pnpm-workspace.yaml turbo.json* ./
COPY packages/ ./packages/
COPY frontend-public/ ./frontend-public/

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=https://api.ug.lawlens.io
ARG NEXT_PUBLIC_ENVIRONMENT=production
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

# Build the application
WORKDIR /app/frontend-public
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copy the complete standalone folder (Next.js 16 monorepo creates standalone/frontend-public/)
COPY --from=builder --chown=nextjs:nodejs /app/frontend-public/.next/standalone ./standalone

# Copy public assets to where server.js is (Next.js expects public/ next to server.js)
COPY --from=builder --chown=nextjs:nodejs /app/frontend-public/public ./standalone/frontend-public/public

# Copy static files to standalone/frontend-public/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend-public/.next/static ./standalone/frontend-public/.next/static

# Copy the FULL pnpm store from root node_modules
# Symlinks in standalone/node_modules point to ../../node_modules/.pnpm/
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# Set working directory to where server.js is (Next.js 16 monorepo structure)
WORKDIR /app/standalone/frontend-public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
