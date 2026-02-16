# =============================================================================
# LawLens Public Frontend - Production Dockerfile
# =============================================================================
# Multi-stage build for Next.js application
# Build context: monorepo root (docker build -f frontend-public/Dockerfile .)
# Port: 3001
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json* ./

# Copy package.json files for all workspaces
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/config/package.json ./packages/config/
COPY packages/hooks/package.json ./packages/hooks/
COPY frontend-public/package.json ./frontend-public/

# Install dependencies (this layer is cached if package.json files don't change)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/ ./packages/
COPY frontend-public/ ./frontend-public/

# Set build-time environment variables
# Note: NEXT_PUBLIC_API_URL must include /api/v1 as the api-client uses it as the base URL
ARG NEXT_PUBLIC_API_URL=https://api.ug.lawlens.io/api/v1
ARG NEXT_PUBLIC_ENVIRONMENT=production
ARG NEXT_PUBLIC_UMAMI_HOST=https://analytics.ug.lawlens.io
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID_PUBLIC=d5b1cdd3-2bf8-43d7-996f-b9c8e3cd591f

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_UMAMI_HOST=$NEXT_PUBLIC_UMAMI_HOST
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID_PUBLIC=$NEXT_PUBLIC_UMAMI_WEBSITE_ID_PUBLIC
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
WORKDIR /app/frontend-public
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2: Runner (Production)
# -----------------------------------------------------------------------------
FROM public.ecr.aws/docker/library/node:20-alpine AS runner

WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copy the standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/frontend-public/.next/standalone ./

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/frontend-public/public ./frontend-public/public

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/frontend-public/.next/static ./frontend-public/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Note: Container health check removed - using ALB target group health checks instead
# Alpine images don't have curl/wget, and Node-based checks have escaping issues

# Start the application
WORKDIR /app/frontend-public
CMD ["node", "server.js"]
