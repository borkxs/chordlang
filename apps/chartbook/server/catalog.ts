/** Filesystem song catalog — one `.cfmd` per song under data/songs/. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SONGS_DIR = path.join(ROOT, "data", "songs");

export interface SongSummary {
  slug: string;
  title: string;
  key: string | null;
  /** Charts in the file: 1 for a song, more for a book (pages split on `---` lines). */
  pages: number;
  updatedAt: string;
}

const PAGE_BREAK = /^[ \t]*-{3,}[ \t]*$/m;

function countPages(body: string): number {
  return Math.max(1, body.split(PAGE_BREAK).filter((p) => p.trim().length > 0).length);
}

export interface Song extends SongSummary {
  body: string;
}

function ensureDir(): void {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

function songPath(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`invalid slug: ${slug}`);
  }
  return path.join(SONGS_DIR, `${slug}.cfmd`);
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || "untitled";
}

function uniqueSlug(title: string): string {
  ensureDir();
  let slug = slugify(title);
  let n = 2;
  while (fs.existsSync(songPath(slug))) {
    slug = `${slugify(title)}-${n++}`;
  }
  return slug;
}

function parseDirective(body: string, key: string): string | null {
  const re = new RegExp(`\\{${key}:\\s*([^}]*)\\}`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

function upsertDirective(body: string, key: string, value: string | null | undefined): string {
  const re = new RegExp(`\\{${key}:\\s*[^}]*\\}\\s*\\n?`, "i");
  const cleaned = body.replace(re, "");
  if (!value) return cleaned;
  return `{${key}: ${value}}\n${cleaned.replace(/^\n+/, "")}`;
}

function readSongFile(slug: string): Song {
  const fp = songPath(slug);
  const stat = fs.statSync(fp);
  const body = fs.readFileSync(fp, "utf8");
  const pages = countPages(body);
  return {
    slug,
    title: parseDirective(body, "book") || parseDirective(body, "title") || slug,
    key: pages > 1 ? null : parseDirective(body, "key"),
    pages,
    body,
    updatedAt: stat.mtime.toISOString(),
  };
}

export function listSongs(): SongSummary[] {
  ensureDir();
  return fs
    .readdirSync(SONGS_DIR)
    .filter((f) => f.endsWith(".cfmd"))
    .map((f) => readSongFile(f.replace(/\.cfmd$/, "")))
    .map(({ slug, title, key, pages, updatedAt }) => ({ slug, title, key, pages, updatedAt }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getSong(slug: string): Song {
  return readSongFile(slug);
}

export function createSong(title: string, body?: string): Song {
  const slug = uniqueSlug(title);
  const initial =
    body ??
    `{title: ${title}}\n{key: }\n| C | Am | F | G |\n`;
  const withTitle = upsertDirective(initial, "title", title);
  fs.writeFileSync(songPath(slug), withTitle.endsWith("\n") ? withTitle : withTitle + "\n", "utf8");
  return readSongFile(slug);
}

export function saveSong(
  slug: string,
  patch: { body?: string; title?: string; key?: string | null },
): Song {
  const current = readSongFile(slug);
  let body = patch.body ?? current.body;
  if (patch.title !== undefined) body = upsertDirective(body, "title", patch.title);
  if (patch.key !== undefined) body = upsertDirective(body, "key", patch.key || null);
  fs.writeFileSync(songPath(slug), body.endsWith("\n") ? body : body + "\n", "utf8");
  return readSongFile(slug);
}

export function deleteSong(slug: string): void {
  fs.unlinkSync(songPath(slug));
}

export function renameSong(slug: string, newTitle: string): Song {
  const song = readSongFile(slug);
  const nextSlug = uniqueSlug(newTitle);
  const body = upsertDirective(song.body, "title", newTitle);
  fs.writeFileSync(songPath(nextSlug), body.endsWith("\n") ? body : body + "\n", "utf8");
  if (nextSlug !== slug) fs.unlinkSync(songPath(slug));
  return readSongFile(nextSlug);
}
