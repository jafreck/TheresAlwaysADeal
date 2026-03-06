# Build context: repo root
FROM node:20-alpine AS builder

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests for dependency install caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/email/package.json packages/email/
COPY packages/scraper/package.json packages/scraper/
COPY packages/worker/package.json packages/worker/
COPY packages/web/package.json packages/web/

RUN pnpm install --frozen-lockfile

# Copy source for web and its workspace dependencies
COPY packages/web packages/web
COPY packages/db packages/db

# NEXT_PUBLIC_ vars must be set at build time for client-side code
ARG NEXT_PUBLIC_API_URL="http://localhost:3001"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build @taad/web and its workspace dependencies
RUN pnpm --filter=@taad/web... run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output bundles everything needed
COPY --from=builder /repo/packages/web/.next/standalone ./
COPY --from=builder /repo/packages/web/.next/static ./packages/web/.next/static

EXPOSE 3000

CMD ["node", "packages/web/server.js"]
