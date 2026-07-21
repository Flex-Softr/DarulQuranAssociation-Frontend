# =============================================================================
# DarulQuran Foundation — Frontend Dockerfile
# Multi-stage Next.js standalone build
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
# These MUST be supplied as Build Args in Dokploy.
ARG NEXT_PUBLIC_BASE_API
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_TOKEN_EXPIRY
ARG NEXT_PUBLIC_MAX_UPLOAD_SIZE
ARG NEXT_PUBLIC_ALLOWED_FILE_TYPES

ENV NEXT_PUBLIC_BASE_API=${NEXT_PUBLIC_BASE_API}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_TOKEN_EXPIRY=${NEXT_PUBLIC_TOKEN_EXPIRY}
ENV NEXT_PUBLIC_MAX_UPLOAD_SIZE=${NEXT_PUBLIC_MAX_UPLOAD_SIZE}
ENV NEXT_PUBLIC_ALLOWED_FILE_TYPES=${NEXT_PUBLIC_ALLOWED_FILE_TYPES}

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]