.DEFAULT_GOAL := help

# Node 22+ required for --experimental-strip-types (see .nvmrc).
NODE_MAJOR := $(shell node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)

help: ## Show this help menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n",$$1,$$2}'

node22: ## Fail fast unless Node 22+ (needed for strip-types TS runners)
	@if [ "$(NODE_MAJOR)" -lt 22 ]; then \
		echo "error: Node 22+ required (found $$(node -v 2>/dev/null || echo none))."; \
		echo "  nvm install 22 && nvm use   # repo pins .nvmrc → 22"; \
		exit 1; \
	fi

setup: ## Install all workspace dependencies (pnpm) + Playwright chromium
	pnpm install
	pnpm exec playwright install chromium

install: setup ## Alias for setup

grammar: ## Rebuild the Peggy parser from chart.peggy (the format spec)
	pnpm run grammar

build: ## Build all packages
	pnpm run build

test: build ## Run all package tests (vitest)
	pnpm run test

dev: ## Launch the live playground (hot-reload preview of current lib code)
	pnpm run dev

graphs: ## Render graph demo examples to apps/playground/dist/graphs/
	pnpm run graphs

previews: node22 grammar ## Render README preview images to docs/assets/ (see docs/readme-previews.md)
	node --experimental-strip-types scripts/render-previews.ts

docker-previews: ## Generate previews in Docker (byte-for-byte identical to CI)
	./scripts/docker-previews.sh

lint: ## Typecheck all packages
	pnpm run lint

cli: build ## Run CLI (usage: make cli CMD='html examples/charts/blues-in-f.cfmd')
	node packages/cli/dist/index.js $(CMD)

font: ## Build the chord font (Python, packages/font)
	$(MAKE) -C packages/font build

font-atlas: node22 font ## Render exhaustive ChordFont symbol atlas (HTML + PNG in packages/font/dist/)
	node --experimental-strip-types tools/font-atlas/render-atlas.ts

lookbook: node22 font ## Build ChordFont look book (reference vs live font → tools/lookbook/lookbook.html)
	node --experimental-strip-types tools/lookbook/render-lookbook.ts

lookbook-pdf: lookbook ## Export lookbook.html → tools/lookbook/lookbook.pdf (waits for fonts/images)
	node --experimental-strip-types tools/lookbook/export-pdf.ts

clean: ## Remove build artifacts and generated parser
	pnpm run clean
	$(MAKE) -C packages/font clean
