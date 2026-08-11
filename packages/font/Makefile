.DEFAULT_GOAL := help

.PHONY: help build build-all build-realbook build-pop test clean setup fetch extract stacks install-playground proof

PYTHON := $(if $(wildcard .venv/bin/python3),.venv/bin/python3,python3)
PYTEST := $(if $(wildcard .venv/bin/pytest),.venv/bin/pytest,pytest)

help: ## Show available targets
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Create .venv and install deps (first time)
	python3 -m venv .venv
	.venv/bin/pip install -e ".[dev]"

fetch: ## Download pinned Petaluma source fonts and OFL license
	$(PYTHON) tools/fetch_sources.py

extract: fetch ## Extract glyph outlines from sources into glyphs/extracted_glyphs.py
	$(PYTHON) tools/extract_glyphs.py

stacks: extract ## Compose Path B stack ligature glyphs → glyphs/stack_glyphs.py
	$(PYTHON) tools/compose_stacks.py

build-realbook: stacks ## Build Real Book style variant
	$(PYTHON) src/build_font.py --style=realbook

build-pop: stacks ## Build Pop style variant
	$(PYTHON) src/build_font.py --style=pop

build-all: build-realbook build-pop ## Build all style variants

build: build-all ## Build all font variants (default: all styles)
	$(MAKE) install-playground

test: build ## Build and run shaping tests
	$(PYTEST) tests/ -v

proof: build ## Build + tests + proof HTML + metrics table
	$(PYTEST) tests/ -v --tb=short
	$(PYTHON) tools/render_proof.py

atlas: build ## Exhaustive symbol atlas → dist/atlas.html + dist/atlas.png (needs repo root: make font-atlas)
	cd ../.. && node --experimental-strip-types tools/font-atlas/render-atlas.ts

clean: ## Remove built fonts from dist/
	rm -rf dist/*.ttf glyphs/extracted_glyphs.py glyphs/stack_glyphs.py

install-playground: ## Copy built fonts to apps/playground and npm fonts/
	mkdir -p ../../apps/playground/public/fonts
	mkdir -p fonts
	cp dist/ChordFont-*.ttf ../../apps/playground/public/fonts/ || true
	cp dist/ChordFont-*.ttf fonts/ || true
	@echo "Installed fonts to playground and npm fonts/"
