# Stack ligatures (Path B)

Closed allowlist of Real Book 2-high parenthesized tension towers.

- **Allowlist:** [`allowlist.json`](allowlist.json)
- **Compositor:** [`../tools/compose_stacks.py`](../tools/compose_stacks.py)
- **Design note:** [`../../../docs/design/stack-ligatures.md`](../../../docs/design/stack-ligatures.md)
- **ADR:** ADR-012 in [`../DECISIONS.md`](../DECISIONS.md)

```bash
make stacks          # extract + compose → glyphs/stack_glyphs.py
make build-realbook  # includes stacks
make test            # shape streams include G7(#11/b9)
```

Canonical input: `G7(#11/b9)` — slash means “stacked over”, not bass.
