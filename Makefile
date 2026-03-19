.PHONY: help up down logs ps reset tools dev lint format typecheck prisma-generate prisma-migrate prisma-studio

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Start infra (postgres, redis)
	@cp -n env/example.env env/local.env 2>/dev/null || true
	@set -a; . ./env/local.env; set +a; \
		docker compose up -d

down: ## Stop infra
	@set -a; . ./env/local.env 2>/dev/null || true; set +a; \
		docker compose down

logs: ## Tail docker logs
	@set -a; . ./env/local.env 2>/dev/null || true; set +a; \
		docker compose logs -f --tail=200

ps: ## Show running containers
	@set -a; . ./env/local.env 2>/dev/null || true; set +a; \
		docker compose ps

reset: ## Destroy volumes (DANGER: wipes DB/Redis data)
	@set -a; . ./env/local.env 2>/dev/null || true; set +a; \
		docker compose down -v

tools: ## Start optional tools (Adminer)
	@set -a; . ./env/local.env 2>/dev/null || true; set +a; \
		docker compose --profile tools up -d

dev: ## Start API server (tsx watch)
	@cp -n env/example.env env/local.env 2>/dev/null || true
	@set -a; . ./env/local.env; set +a; \
		npm run dev

lint: ## Run eslint
	@npm run lint

format: ## Run prettier check
	@npm run format

typecheck: ## Run TypeScript typecheck
	@npm run typecheck

prisma-generate: ## prisma generate
	@cp -n env/example.env env/local.env 2>/dev/null || true
	@set -a; . ./env/local.env; set +a; \
		npm run prisma:generate

prisma-migrate: ## prisma migrate dev
	@cp -n env/example.env env/local.env 2>/dev/null || true
	@set -a; . ./env/local.env; set +a; \
		npm run prisma:migrate

prisma-studio: ## prisma studio
	@cp -n env/example.env env/local.env 2>/dev/null || true
	@set -a; . ./env/local.env; set +a; \
		npm run prisma:studio

