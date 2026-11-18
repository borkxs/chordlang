import { defineConfig } from "vite";
import { resolve } from "node:path";
import { catalogPlugin } from "./server/vite-plugin";

const ROOT = __dirname;

// Aliases point at package SRC (same as the playground): editing a package
// hot-reloads chartbook with no rebuild.
export default defineConfig({
  plugins: [catalogPlugin()],
  resolve: {
    alias: {
      "@chordlang/chord": resolve(ROOT, "../../packages/chord/src/index.ts"),
      "@chordlang/parser": resolve(ROOT, "../../packages/parser/src/index.ts"),
      "@chordlang/render": resolve(ROOT, "../../packages/render/src/index.ts"),
    },
  },
  server: {
    port: 5178,
    host: "127.0.0.1",
    open: !process.env.CI && !process.env.CHARTBOOK_NO_OPEN,
  },
});
