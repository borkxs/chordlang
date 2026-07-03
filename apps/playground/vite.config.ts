import { defineConfig } from "vite";
import { resolve } from "node:path";

// Aliases point at package SRC, not dist: editing any package hot-reloads the
// playground with no rebuild. (Tradeoff, by design: previews TS source, not
// the published build.)
export default defineConfig({
  resolve: {
    alias: {
      "@chordlang/chord": resolve(__dirname, "../../packages/chord/src/index.ts"),
      "@chordlang/parse": resolve(__dirname, "../../packages/parse/src/index.ts"),
      "@chordlang/render": resolve(__dirname, "../../packages/render/src/index.ts"),
    },
  },
});
