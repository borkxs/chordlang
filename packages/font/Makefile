.DEFAULT_GOAL := help

.PHONY: help build test clean setup fetch extract install-playground proof

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

build: extract ## Build dist/ChordProof.ttf and copy to playground
	$(PYTHON) src/build_font.py
	$(MAKE) install-playground

test: build ## Build and run shaping tests
	$(PYTEST) tests/ -v

proof: build ## Build + tests + proof HTML + metrics table
	$(PYTEST) tests/ -v --tb=short
	$(PYTHON) tools/render_proof.py

clean: ## Remove built fonts from dist/
	rm -rf dist/*.ttf glyphs/extracted_glyphs.py

install-playground: ## Copy built font to apps/playground and npm fonts/
	cp dist/ChordProof.ttf ../../apps/playground/public/fonts/ChordProof.ttf
	cp dist/ChordProof.ttf fonts/ChordProof.ttf
