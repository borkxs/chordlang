/** Vite middleware: REST API over the filesystem song catalog. */

import type { Plugin } from "vite";
import {
  createSong,
  deleteSong,
  getSong,
  listSongs,
  renameSong,
  saveSong,
} from "./catalog";

async function readJson(req: import("http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(Buffer.from(c));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(res: import("http").ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(body);
}

export function catalogPlugin(): Plugin {
  return {
    name: "chartbook-catalog",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        try {
          const pathOnly = url.split("?")[0];

          if (req.method === "GET" && pathOnly === "/api/songs") {
            return send(res, 200, listSongs());
          }

          const one = pathOnly.match(/^\/api\/songs\/([^/]+)$/);
          const rename = pathOnly.match(/^\/api\/songs\/([^/]+)\/rename$/);

          if (req.method === "GET" && one) {
            return send(res, 200, getSong(decodeURIComponent(one[1])));
          }

          if (req.method === "POST" && pathOnly === "/api/songs") {
            const body = (await readJson(req)) as { title?: string; body?: string };
            const title = (body.title || "Untitled").trim() || "Untitled";
            return send(res, 201, createSong(title, body.body));
          }

          if (req.method === "PUT" && one) {
            const slug = decodeURIComponent(one[1]);
            const body = (await readJson(req)) as {
              body?: string;
              title?: string;
              key?: string | null;
            };
            return send(res, 200, saveSong(slug, body));
          }

          if (req.method === "POST" && rename) {
            const slug = decodeURIComponent(rename[1]);
            const body = (await readJson(req)) as { title?: string };
            const title = (body.title || "").trim();
            if (!title) return send(res, 400, { error: "title required" });
            return send(res, 200, renameSong(slug, title));
          }

          if (req.method === "DELETE" && one) {
            deleteSong(decodeURIComponent(one[1]));
            return send(res, 204, null);
          }

          return send(res, 404, { error: "not found" });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const status = /not found|ENOENT/i.test(msg) ? 404 : 400;
          return send(res, status, { error: msg });
        }
      });
    },
  };
}
