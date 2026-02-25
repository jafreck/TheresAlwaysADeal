# Build context: repo root
FROM node:20-alpine AS builder

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests for dependency install caching
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/scraper/package.json packages/scraper/
COPY packages/worker/package.json packages/worker/
COPY packages/web/package.json packages/web/

RUN pnpm install

# Copy source files for packages needed to build worker
COPY packages/worker packages/worker
COPY packages/db packages/db
COPY packages/scraper packages/scraper

# Build @taad/worker and its workspace dependencies (... = include deps)
RUN pnpm --filter=@taad/worker... run build

# Create self-contained production deployment directory
RUN pnpm deploy --filter=@taad/worker --prod /app/deploy

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /repo/packages/worker/dist ./dist
COPY --from=builder /app/deploy/node_modules ./node_modules

CMD ["node", "dist/index.js"]
