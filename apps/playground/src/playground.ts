import type { PlaygroundKind } from "./routes";
import { examplePath } from "./routes";
import type { ExampleEntry, LoadedExample } from "./examples";

export function wireExampleNav(opts: {
  kind: PlaygroundKind;
  nav: HTMLElement;
  order: ExampleEntry[];
  bySlug: Record<string, LoadedExample>;
  activeSlug: string;
  onSelect: (slug: string) => void;
  peerKind?: PlaygroundKind;
  peerBySlug?: Record<string, LoadedExample>;
}): void {
  const { kind, nav, order, bySlug, activeSlug, onSelect, peerKind, peerBySlug } = opts;
  nav.replaceChildren();

  for (const entry of order) {
    const b = document.createElement("button");
    b.textContent = entry.label;
    b.className = "chip";
    if (entry.file === activeSlug) b.classList.add("active");
    b.onclick = () => {
      if (entry.file === activeSlug) return;
      history.pushState(null, "", examplePath(kind, entry.file));
      onSelect(entry.file);
      nav.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      b.classList.add("active");
    };
    nav.appendChild(b);
  }

  if (!peerKind || !peerBySlug) return;
  const peerSlug = activeSlug in peerBySlug ? activeSlug : null;
  if (!peerSlug) return;

  const a = document.createElement("a");
  a.className = "peer-link";
  a.textContent = peerKind === "graph" ? "graph →" : "chart →";
  a.href = examplePath(peerKind, peerSlug);
  nav.appendChild(a);
}

export function onRouteChange(fn: () => void): void {
  window.addEventListener("popstate", fn);
}
