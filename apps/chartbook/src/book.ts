/**
 * Books: one .cfmd holding several charts. Pages are separated by a line of
 * three or more dashes; each page is a complete chordlang chart with its own
 * directives. An optional `{book: Name}` directive (anywhere, by convention on
 * the first page) names the file in the catalog and is hidden from the page meta.
 */

const PAGE_BREAK = /^[ \t]*-{3,}[ \t]*$/m;

export function splitPages(body: string): string[] {
  const pages = body
    .split(PAGE_BREAK)
    .map((p) => p.replace(/^\s*\n/, ""))
    .filter((p) => p.trim().length > 0);
  return pages.length ? pages : [body];
}

export function isBook(body: string): boolean {
  return splitPages(body).length > 1;
}

export function bookTitle(body: string): string | null {
  const m = body.match(/\{book:\s*([^}]*)\}/i);
  return m ? m[1].trim() || null : null;
}
