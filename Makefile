SHELL := /bin/bash

# ─── Docker helpers ────────────────────────────────────────────────────────────
.PHONY: ensure-docker
ensure-docker:
	@command -v docker >/dev/null 2>&1 || { echo "Docker CLI not found. Install docker first."; exit 1; }
	@if ! docker info >/dev/null 2>&1; then \
		if command -v colima >/dev/null 2>&1; then \
			echo "Docker daemon not running; starting Colima..."; \
			colima start --cpu 2 --memory 4 --disk 30; \
		else \
			echo "Docker daemon is not running. Start Docker Desktop or install Colima."; \
			exit 1; \
		fi; \
	fi

# ─── Full stack (app + infra) ─────────────────────────────────────────────────
.PHONY: up down restart ps logs build

## Start everything: postgres, redis, db setup, api, worker, web
up: ensure-docker
	@docker compose up -d --build
	@docker compose ps

## Stop everything
down:
	@docker compose down

## Rebuild and restart all containers
restart: down up

## Show running container status
ps:
	@docker compose ps

## Tail logs for all services
logs:
	@docker compose logs -f --tail=100

## Build all images without starting
build: ensure-docker
	@docker compose build

# ─── Infrastructure only (just postgres + redis) ──────────────────────────────
.PHONY: infra-up infra-down infra-restart infra-ps infra-logs

## Start only infrastructure (postgres + redis)
infra-up: ensure-docker
	@docker compose up -d postgres redis
	@docker compose ps postgres redis

## Stop only infrastructure
infra-down:
	@docker compose down

## Restart infrastructure
infra-restart: infra-down infra-up

## Infrastructure status
infra-ps:
	@docker compose ps postgres redis

## Infrastructure logs
infra-logs:
	@docker compose logs -f --tail=100 postgres redis

# ─── Database ─────────────────────────────────────────────────────────────────
.PHONY: db-push db-seed db-reset db-studio

## Push schema to database (local dev — reads .env)
db-push:
	@pnpm --filter @taad/db build
	@cd packages/db && node --env-file=../../.env ./node_modules/drizzle-kit/bin.cjs push --force

## Seed the database (local dev — reads .env)
db-seed:
	@pnpm --filter @taad/db build
	@pnpm --filter @taad/db db:seed

## Reset: drop volumes, re-create infra, push schema, seed
db-reset: ensure-docker
	@docker compose down -v
	@docker compose up -d postgres redis
	@echo "Waiting for postgres..."
	@until docker compose exec postgres pg_isready -U postgres -d taad >/dev/null 2>&1; do sleep 1; done
	@$(MAKE) db-push
	@$(MAKE) db-seed
	@echo "✅ Database reset complete"

## Open Drizzle Studio
db-studio:
	@pnpm --filter @taad/db db:studio

# ─── Local development (no containers for app code) ──────────────────────────
.PHONY: dev dev-setup install test lint type-check format

## Full local dev setup: install deps, start infra, push schema, seed, run dev servers
dev-setup: install infra-up db-push db-seed
	@echo "✅ Ready — run 'make dev' to start dev servers"

## Install dependencies
install:
	@pnpm install

## Start all dev servers via turborepo (infra must be running)
dev:
	@pnpm dev

## Run all tests
test:
	@pnpm test

## Lint all packages
lint:
	@pnpm lint

## Type-check all packages
type-check:
	@pnpm type-check

## Format code
format:
	@pnpm format

# ─── Cleanup ──────────────────────────────────────────────────────────────────
.PHONY: clean nuke

## Remove build artifacts
clean:
	@pnpm clean

## Full nuke: stop containers, remove volumes, remove node_modules
nuke: down
	@docker compose down -v 2>/dev/null || true
	@rm -rf node_modules packages/*/node_modules packages/*/.next packages/*/dist
	@echo "✅ Everything cleaned"

# ─── Help ─────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  TAAD Makefile"
	@echo "  ─────────────────────────────────────────────────"
	@echo ""
	@echo "  Full Stack (Docker):"
	@echo "    make up            Start everything in containers"
	@echo "    make down          Stop everything"
	@echo "    make restart       Rebuild & restart"
	@echo "    make logs          Tail all logs"
	@echo "    make ps            Show status"
	@echo "    make build         Build images only"
	@echo ""
	@echo "  Infrastructure Only:"
	@echo "    make infra-up      Start postgres + redis"
	@echo "    make infra-down    Stop infrastructure"
	@echo ""
	@echo "  Database:"
	@echo "    make db-push       Push schema"
	@echo "    make db-seed       Seed data"
	@echo "    make db-reset      Drop & recreate from scratch"
	@echo "    make db-studio     Open Drizzle Studio"
	@echo ""
	@echo "  Local Dev (no app containers):"
	@echo "    make dev-setup     Install, infra, schema, seed"
	@echo "    make dev           Start dev servers"
	@echo "    make test          Run tests"
	@echo "    make lint          Lint"
	@echo "    make type-check    Type-check"
	@echo ""
	@echo "  Cleanup:"
	@echo "    make clean         Remove build artifacts"
	@echo "    make nuke          Full reset (containers + deps)"
	@echo ""
