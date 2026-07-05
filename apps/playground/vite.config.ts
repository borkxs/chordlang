import { defineConfig, type Plugin } from "vite";
import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = __dirname;
const MANIFEST = join(ROOT, "../../examples/manifest.json");

/** Dev rewrites + static /chart/:slug and /graph/:slug index.html copies after build. */
function exampleRoutesPlugin(): Plugin {
  return {
    name: "example-routes",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? "";
        const path = raw.split("?")[0] ?? "";
        const qs = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
        if (/^\/chart(\/[^/?#]+)?\/?$/.test(path)) {
          req.url = `/index.html${qs}`;
        } else if (/^\/graph(\/[^/?#]+)?\/?$/.test(path)) {
          req.url = `/graph.html${qs}`;
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
export default defineConfig({
  plugins: [exampleRoutesPlugin()],
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
      "@chordlang/parse": resolve(ROOT, "../../packages/parse/src/index.ts"),
      "@chordlang/render": resolve(ROOT, "../../packages/render/src/index.ts"),
    },
  },
});
