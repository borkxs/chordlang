import { defineConfig, type Plugin } from "vite";
import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = __dirname;
const MANIFEST = join(ROOT, "../../examples/manifest.json");
const PAGES_BASE = "/chordlang/";

/** Dev rewrites + static /chart/:slug and /graph/:slug index.html copies after build. */
function exampleRoutesPlugin(pagesBase: string): Plugin {
  const routePrefix = pagesBase.replace(/\/$/, "") || "";

  return {
    name: "example-routes",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? "";
        const path = raw.split("?")[0] ?? "";
        const qs = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
        const chart = routePrefix
          ? new RegExp(`^${routePrefix}/chart(/[^/?#]+)?/?$`)
          : /^\/chart(\/[^/?#]+)?\/?$/;
        const graph = routePrefix
          ? new RegExp(`^${routePrefix}/graph(/[^/?#]+)?/?$`)
          : /^\/graph(\/[^/?#]+)?\/?$/;
        if (chart.test(path)) {
          req.url = `${pagesBase}index.html${qs}`.replace(/\/+/g, "/");
        } else if (graph.test(path)) {
          req.url = `${pagesBase}graph.html${qs}`.replace(/\/+/g, "/");
        }
        next();
      });
    },
    closeBundle() {
      const dist = join(ROOT, "dist");
      const { charts, graphs } = JSON.parse(readFileSync(MANIFEST, "utf8")) as {
        charts: { file: string }[];
        graphs: { file: string }[];
      };
      for (const { file } of charts) {
        const dir = join(dist, "chart", file);
        mkdirSync(dir, { recursive: true });
        cpSync(join(dist, "index.html"), join(dir, "index.html"));
      }
      for (const { file } of graphs) {
        const dir = join(dist, "graph", file);
        mkdirSync(dir, { recursive: true });
        cpSync(join(dist, "graph.html"), join(dir, "index.html"));
      }
    },
  };
}

// Aliases point at package SRC, not dist: editing any package hot-reloads the
// playground with no rebuild. (Tradeoff, by design: previews TS source, not
// the published build.)
export default defineConfig(() => {
  const pages = process.env.GITHUB_PAGES === "true";
  const base = pages ? PAGES_BASE : "/";

  return {
    base,
    plugins: [exampleRoutesPlugin(base)],
    build: {
      rollupOptions: {
        input: {
          main: resolve(ROOT, "index.html"),
          graph: resolve(ROOT, "graph.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@chordlang/chord": resolve(ROOT, "../../packages/chord/src/index.ts"),
        "@chordlang/parser": resolve(ROOT, "../../packages/parser/src/index.ts"),
        "@chordlang/render": resolve(ROOT, "../../packages/render/src/index.ts"),
        "@chordlang/graph": resolve(ROOT, "../../packages/graph/src/index.ts"),
      },
    },
  };
});
