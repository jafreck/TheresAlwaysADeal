# Build context: repo root
FROM node:20-alpine AS builder

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests for dependency install caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/scraper/package.json packages/scraper/
COPY packages/worker/package.json packages/worker/
COPY packages/web/package.json packages/web/

RUN pnpm install --frozen-lockfile

# Copy source files for packages needed to build api
COPY packages/api packages/api
COPY packages/db packages/db

# Build @taad/api and its workspace dependencies (... = include deps)
RUN pnpm --filter=@taad/api... run build

# Create self-contained production deployment directory
RUN pnpm deploy --filter=@taad/api --prod /app/deploy

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /repo/packages/api/dist ./dist
COPY --from=builder /app/deploy/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/index.js"]
