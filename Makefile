.DEFAULT_GOAL := help

help: ## Show this help menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n",$$1,$$2}'

setup: ## Install all workspace dependencies (pnpm)
	pnpm install

install: setup ## Alias for setup

grammar: ## Rebuild the Peggy parser from chart.peggy (the format spec)
	pnpm run grammar

build: ## Build all packages
	pnpm run build

test: ## Run all package tests (vitest)
	pnpm run test

dev: ## Launch the live playground (hot-reload preview of current lib code)
	pnpm run dev

lint: ## Typecheck all packages
	pnpm run lint

clean: ## Remove build artifacts and generated parser
	pnpm run clean
