export type PlaygroundKind = "chart" | "graph";

/** Parse /chart/giant-steps, /graph/ii-v-i-chain, /, /graph.html */
export function parseRoute(pathname: string): { kind: PlaygroundKind; slug: string | null } {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/graph.html") return { kind: "graph", slug: null };
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "chart") return { kind: "chart", slug: parts[1] ?? null };
  if (parts[0] === "graph") return { kind: "graph", slug: parts[1] ?? null };
  return { kind: "chart", slug: null };
}

export function examplePath(kind: PlaygroundKind, slug: string): string {
  return `/${kind}/${slug}`;
}

export function resolveSlug(
  slug: string | null,
  bySlug: Record<string, unknown>,
  defaultSlug: string,
): string {
  if (slug && slug in bySlug) return slug;
  return defaultSlug;
}
