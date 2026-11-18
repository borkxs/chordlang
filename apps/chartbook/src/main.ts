// HIERARCHY
// Edit view:     P1 the engraved chart pages (preview; a book is a vertical stack, one page per chart)
//                P2 chordlang source       P3 title/key bar, pane labels, status
// Compare view:  P1 each chart's chord grid (one per page region)   P2 each page's title + key   P3 topbar toggles, meta line, section tags
// Sidebar:       P1 the active song                   P2 other song titles      P3 key/page-count/slug meta, compare pins, footer
import { parseChart } from "@chordlang/parser";
import { bookTitle, isBook, splitPages } from "./book";
import { renderChart, type Notation } from "./render";
import { parseKey, type Key } from "./roman";

interface SongSummary {
  slug: string;
  title: string;
  key: string | null;
  pages: number;
  updatedAt: string;
}

interface Song extends SongSummary {
  body: string;
}

type View = "edit" | "compare";
/** Compare: each chart in its own key, or every chart moved to the first pinned chart's key. */
type KeyMode = "original" | "common";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

const songList = $("#song-list");
const search = $<HTMLInputElement>("#search");
const btnNew = $<HTMLButtonElement>("#btn-new");
const btnDelete = $<HTMLButtonElement>("#btn-delete");
const empty = $("#empty");
const editorPane = $("#editor-pane");
const comparePane = $("#compare-pane");
const compareGrid = $("#compare-grid");
const compareEmpty = $("#compare-empty");
const cmpCount = $("#cmp-count");
const topbar = $("#topbar");
const keySeg = $("#key-seg");
const titleInput = $<HTMLInputElement>("#title");
const keyInput = $<HTMLInputElement>("#key");
const source = $<HTMLTextAreaElement>("#source");
const preview = $("#preview");
const parseMsg = $("#parse-msg");
const saveStatus = $("#save-status");

let songs: SongSummary[] = [];
let activeSlug: string | null = null;
let dirty = false;
let saveTimer: number | null = null;
let suppressInput = false;
let view: View = "edit";
let notation: Notation = "chords";
let keyMode: KeyMode = "original";
let compareSlugs: string[] = [];
const bodyCache = new Map<string, string>();

function loadPref<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function savePref(k: string, v: unknown): void {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private window etc. */
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

function setStatus(text: string): void {
  saveStatus.textContent = text;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderList(): void {
  const q = search.value.trim().toLowerCase();
  const filtered = songs.filter(
    (s) => !q || s.title.toLowerCase().includes(q) || s.slug.includes(q),
  );
  songList.innerHTML = filtered
    .map((s) => {
      const pinned = compareSlugs.includes(s.slug);
      return `
      <div class="song-row${s.slug === activeSlug ? " active" : ""}">
        <button type="button" class="song-item" data-slug="${s.slug}">
          <span>${escapeHtml(s.title)}</span>
          <span class="meta">${s.pages > 1 ? `${s.pages} pages` : s.key ? escapeHtml(s.key) : "—"} · ${s.slug}</span>
        </button>
        <button type="button" class="cmp-toggle" data-cmp="${s.slug}" aria-pressed="${pinned}"
          title="${pinned ? "Remove from compare" : "Add to compare"}" aria-label="${pinned ? "Remove from compare" : "Add to compare"}">${pinned ? "✓" : "+"}</button>
      </div>`;
    })
    .join("");
  const n = compareSlugs.length;
  cmpCount.textContent = n ? String(n) : "";
}

/** Render every page of a body as its own `.page` article; errors become an error page. */
function renderPages(
  body: string,
  cls: string,
  attrs = "",
  transposeTo: Key | null = null,
): { html: string; errors: string[] } {
  const pages = splitPages(body);
  const errors: string[] = [];
  const html = pages
    .map((page, i) => {
      let inner: string;
      try {
        inner = renderChart(parseChart(page), notation, { transposeTo });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(pages.length > 1 ? `page ${i + 1}: ${msg}` : msg);
        const title = page.match(/\{title:\s*([^}]*)\}/i)?.[1]?.trim() || `page ${i + 1}`;
        inner = `<h2 class="chordlang-title">${escapeHtml(title)}</h2><div class="chordlang-meta chordlang-warn">${escapeHtml(msg)}</div>`;
      }
      return `<article class="${cls}"${attrs} data-page="${i + 1}">${inner}</article>`;
    })
    .join("");
  return { html, errors };
}

function renderPreview(body: string): void {
  const { html, errors } = renderPages(body, "page");
  preview.innerHTML = html;
  const n = splitPages(body).length;
  parseMsg.textContent = errors.length ? errors.join(" · ") : n > 1 ? `ok · ${n} pages` : "ok";
  parseMsg.className = errors.length ? "parse-msg err" : "parse-msg";
}

async function songBody(slug: string): Promise<string> {
  const cached = bodyCache.get(slug);
  if (cached !== undefined) return cached;
  const song = await api<Song>(`/api/songs/${encodeURIComponent(slug)}`);
  bodyCache.set(slug, song.body);
  return song.body;
}

async function renderCompare(): Promise<void> {
  const slugs = compareSlugs.filter((s) => songs.some((x) => x.slug === s));
  if (slugs.length !== compareSlugs.length) {
    compareSlugs = slugs;
    savePref("chartbook.compare", compareSlugs);
  }
  compareEmpty.classList.toggle("hidden", slugs.length > 0);
  const bodies = await Promise.all(slugs.map(songBody));
  const target = keyMode === "common" ? firstKey(bodies) : null;
  compareGrid.innerHTML = bodies
    .map((body, i) => renderPages(body, "page compare-page", ` data-slug="${slugs[i]}"`, target).html)
    .join("");
}

/** The first parseable `{key: …}` across the pinned bodies, page by page. */
function firstKey(bodies: string[]): Key | null {
  for (const body of bodies) {
    for (const page of splitPages(body)) {
      const k = parseKey(page.match(/\{key:\s*([^}]*)\}/i)?.[1]);
      if (k) return k;
    }
  }
  return null;
}

function applyView(): void {
  topbar.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.view === view));
  });
  topbar.querySelectorAll<HTMLButtonElement>("[data-notation]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.notation === notation));
  });
  topbar.querySelectorAll<HTMLButtonElement>("[data-keys]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.keys === keyMode));
  });
  const showCompare = view === "compare";
  keySeg.classList.toggle("hidden", !showCompare);
  comparePane.classList.toggle("hidden", !showCompare);
  editorPane.classList.toggle("hidden", showCompare || !activeSlug);
  empty.classList.toggle("hidden", showCompare || !!activeSlug);
  if (showCompare) {
    void renderCompare();
    history.replaceState(null, "", "#compare");
  } else if (activeSlug) {
    history.replaceState(null, "", `#${encodeURIComponent(activeSlug)}`);
  }
}

function setView(v: View): void {
  view = v;
  applyView();
}

function setNotation(n: Notation): void {
  notation = n;
  savePref("chartbook.notation", n);
  if (activeSlug) renderPreview(source.value);
  applyView();
}

function setKeyMode(m: KeyMode): void {
  keyMode = m;
  savePref("chartbook.keys", m);
  applyView();
}

function toggleCompare(slug: string): void {
  compareSlugs = compareSlugs.includes(slug)
    ? compareSlugs.filter((s) => s !== slug)
    : [...compareSlugs, slug];
  savePref("chartbook.compare", compareSlugs);
  renderList();
  if (view === "compare") void renderCompare();
}

async function refreshSongs(): Promise<void> {
  songs = await api<SongSummary[]>("/api/songs");
  renderList();
}

async function selectSong(slug: string): Promise<void> {
  if (dirty && activeSlug) {
    await saveActive(true);
  }
  const song = await api<Song>(`/api/songs/${encodeURIComponent(slug)}`);
  bodyCache.set(song.slug, song.body);
  activeSlug = song.slug;
  suppressInput = true;
  titleInput.value = song.title;
  source.value = song.body;
  suppressInput = false;
  syncMetaFromBody(song.body);
  dirty = false;
  renderPreview(song.body);
  renderList();
  setView("edit");
  setStatus("saved");
}

/** Books: the title input edits `{book: …}` and there is no single key, so the key input hides. */
function syncMetaFromBody(body: string): void {
  const book = isBook(body);
  const t = book
    ? bookTitle(body) || body.match(/\{title:\s*([^}]*)\}/i)?.[1]?.trim()
    : body.match(/\{title:\s*([^}]*)\}/i)?.[1]?.trim();
  const k = body.match(/\{key:\s*([^}]*)\}/i)?.[1]?.trim();
  suppressInput = true;
  if (t) titleInput.value = t;
  keyInput.value = book ? "" : (k ?? "");
  keyInput.classList.toggle("hidden", book);
  suppressInput = false;
}

function upsertDirectiveInSource(key: string, value: string): void {
  const re = new RegExp(`\\{${key}:\\s*[^}]*\\}\\s*\\n?`, "i");
  let body = source.value.replace(re, "");
  if (value) body = `{${key}: ${value}}\n${body.replace(/^\n+/, "")}`;
  suppressInput = true;
  source.value = body;
  suppressInput = false;
}

function markDirty(from: "source" | "meta" = "source"): void {
  if (suppressInput || !activeSlug) return;
  if (from === "meta") {
    if (isBook(source.value)) {
      upsertDirectiveInSource("book", titleInput.value.trim());
    } else {
      upsertDirectiveInSource("title", titleInput.value.trim() || "Untitled");
      upsertDirectiveInSource("key", keyInput.value.trim());
    }
  } else {
    syncMetaFromBody(source.value);
  }
  dirty = true;
  setStatus("editing…");
  renderPreview(source.value);
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void saveActive();
  }, 450);
}

async function saveActive(force = false): Promise<void> {
  if (!activeSlug || (!dirty && !force)) return;
  const body = source.value;
  const title = titleInput.value.trim() || "Untitled";
  const key = keyInput.value.trim() || null;
  // A book's title/key live in its pages' own directives; only the body is sent.
  const patch = isBook(body) ? { body } : { body, title, key };
  const saved = await api<Song>(`/api/songs/${encodeURIComponent(activeSlug)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  dirty = false;
  activeSlug = saved.slug;
  bodyCache.set(saved.slug, saved.body);
  // Keep textarea if title/key directives were rewritten
  if (saved.body !== body && !force) {
    const pos = source.selectionStart;
    suppressInput = true;
    source.value = saved.body;
    source.selectionStart = source.selectionEnd = pos;
    suppressInput = false;
    renderPreview(saved.body);
  }
  await refreshSongs();
  setStatus(`saved ${new Date(saved.updatedAt).toLocaleTimeString()}`);
}

async function onNew(): Promise<void> {
  const title = window.prompt("Song title", "Untitled");
  if (!title) return;
  const song = await api<Song>("/api/songs", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  await refreshSongs();
  await selectSong(song.slug);
  source.focus();
}

async function onDelete(): Promise<void> {
  if (!activeSlug) return;
  const song = songs.find((s) => s.slug === activeSlug);
  if (!window.confirm(`Delete “${song?.title || activeSlug}”?`)) return;
  await api(`/api/songs/${encodeURIComponent(activeSlug)}`, { method: "DELETE" });
  bodyCache.delete(activeSlug);
  compareSlugs = compareSlugs.filter((s) => s !== activeSlug);
  savePref("chartbook.compare", compareSlugs);
  activeSlug = null;
  dirty = false;
  await refreshSongs();
  applyView();
  history.replaceState(null, "", "#");
  setStatus("deleted");
}

songList.addEventListener("click", (ev) => {
  const target = ev.target as HTMLElement;
  const cmp = target.closest<HTMLElement>(".cmp-toggle");
  if (cmp?.dataset.cmp) {
    toggleCompare(cmp.dataset.cmp);
    return;
  }
  const btn = target.closest<HTMLElement>(".song-item");
  if (!btn?.dataset.slug) return;
  void selectSong(btn.dataset.slug);
});

topbar.addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!btn) return;
  if (btn.dataset.view) setView(btn.dataset.view as View);
  if (btn.dataset.notation) setNotation(btn.dataset.notation as Notation);
  if (btn.dataset.keys) setKeyMode(btn.dataset.keys as KeyMode);
});

search.addEventListener("input", renderList);
btnNew.addEventListener("click", () => void onNew());
btnDelete.addEventListener("click", () => void onDelete());
source.addEventListener("input", () => markDirty("source"));
titleInput.addEventListener("input", () => markDirty("meta"));
keyInput.addEventListener("input", () => markDirty("meta"));

window.addEventListener("keydown", (ev) => {
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "s") {
    ev.preventDefault();
    void saveActive(true);
  }
});

window.addEventListener("beforeunload", (ev) => {
  if (dirty) {
    ev.preventDefault();
    ev.returnValue = "";
  }
});

async function boot(): Promise<void> {
  notation = loadPref<Notation>("chartbook.notation", "chords");
  keyMode = loadPref<KeyMode>("chartbook.keys", "original");
  compareSlugs = loadPref<string[]>("chartbook.compare", []);
  await refreshSongs();
  const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (hash === "compare") {
    setView("compare");
    return;
  }
  if (hash && songs.some((s) => s.slug === hash)) {
    await selectSong(hash);
  } else if (songs[0]) {
    await selectSong(songs[0].slug);
  } else {
    applyView();
    setStatus("empty catalog");
  }
}

void boot();
