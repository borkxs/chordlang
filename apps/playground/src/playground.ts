import {
  EXAMPLES,
  exampleGroups,
  type LoadedExample,
} from "./examples";
import { examplePath } from "./routes";
import {
  BUILDS,
  FLAG_HINTS,
  FLAG_ORDER,
  type FontBuild,
} from "./builds";

export function onRouteChange(fn: () => void): void {
  window.addEventListener("popstate", fn);
}

export function closeMenus(): void {
  document.querySelectorAll(".menu").forEach((m) => m.classList.remove("open"));
}

export function refreshExampleChrome(
  nameEl: HTMLElement,
  badgeEl: HTMLElement,
  ex: LoadedExample,
): void {
  nameEl.textContent = ex.label;
  badgeEl.textContent = ex.badge;
  badgeEl.className = `badge${ex.badge === "gv" ? " gv" : ""}`;
}

/** Wire the grouped example picker + ‹ › steppers + [ ] keys. */
export function wireExamplePicker(opts: {
  button: HTMLElement;
  menu: HTMLElement;
  prevBtn: HTMLElement;
  nextBtn: HTMLElement;
  getIndex: () => number;
  onSelect: (ex: LoadedExample, push: boolean) => void;
}): void {
  const { button, menu, prevBtn, nextBtn, getIndex, onSelect } = opts;

  function renderMenu(): void {
    const idx = getIndex();
    menu.innerHTML = exampleGroups()
      .map((g) => {
        const items = EXAMPLES.map((ex, i) =>
          ex.group !== g
            ? ""
            : `<button type="button" class="item ${i === idx ? "sel" : ""}" data-i="${i}">
                 <span>${ex.label}</span>
                 <span class="sub">${ex.badge}</span>
               </button>`,
        ).join("");
        return `<div class="group">${g}</div>${items}`;
      })
      .join("");
  }

  function step(delta: number): void {
    const n = EXAMPLES.length;
    const next = EXAMPLES[(getIndex() + delta + n) % n];
    if (next) onSelect(next, true);
  }

  function toggle(): void {
    const was = menu.classList.contains("open");
    closeMenus();
    if (!was) {
      renderMenu();
      menu.classList.add("open");
    }
  }

  button.addEventListener("click", (ev) => {
    if ((ev.target as HTMLElement).closest(".menu")) return;
    if ((ev.target as HTMLElement).closest(".ctl-step")) return;
    toggle();
  });
  button.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      toggle();
    }
  });

  menu.addEventListener("click", (ev) => {
    const it = (ev.target as HTMLElement).closest<HTMLElement>(".item");
    if (!it) return;
    ev.stopPropagation();
    const ex = EXAMPLES[+it.dataset.i!];
    if (ex) onSelect(ex, true);
    closeMenus();
  });

  prevBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    closeMenus();
    step(-1);
  });
  nextBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    closeMenus();
    step(1);
  });

  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable) return;
    if (e.key === "[") step(-1);
    if (e.key === "]") step(1);
    if (e.key === "Escape") closeMenus();
  });
}

/** Wire the font-build dropdown. */
export function wireBuildPicker(opts: {
  button: HTMLElement;
  menu: HTMLElement;
  getId: () => string;
  onSelect: (build: FontBuild) => void;
}): void {
  const { button, menu, getId, onSelect } = opts;

  function renderMenu(): void {
    const id = getId();
    menu.innerHTML = BUILDS.map(
      (b) =>
        `<button type="button" class="item ${b.id === id ? "sel" : ""}" data-id="${b.id}">
           <span>${b.name}</span>
           <span class="sub">${FLAG_ORDER.filter((f) => b.flags[f]).join("+") || "—"}</span>
         </button>`,
    ).join("");
  }

  function toggle(): void {
    const was = menu.classList.contains("open");
    closeMenus();
    if (!was) {
      renderMenu();
      menu.classList.add("open");
    }
  }

  button.addEventListener("click", (ev) => {
    if ((ev.target as HTMLElement).closest(".menu")) return;
    toggle();
  });
  button.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      toggle();
    }
  });

  menu.addEventListener("click", (ev) => {
    const it = (ev.target as HTMLElement).closest<HTMLElement>(".item");
    if (!it) return;
    ev.stopPropagation();
    const build = BUILDS.find((b) => b.id === it.dataset.id);
    if (build) onSelect(build);
    closeMenus();
  });
}

export function renderFlagStrip(el: HTMLElement, build: FontBuild): void {
  el.innerHTML =
    `<span class="lbl">features</span>` +
    FLAG_ORDER.map(
      (f) =>
        `<span class="flag ${build.flags[f] ? "on" : ""}" title="${FLAG_HINTS[f]}">${f}</span>`,
    ).join("");
}

/** Apply curated build font + features via CSS variables on a root element. */
export function applyBuild(root: HTMLElement, build: FontBuild): void {
  root.style.setProperty("--playground-chord-font", `"${build.fontFamily}"`);
  root.style.setProperty(
    "--playground-chord-features",
    FLAG_ORDER.map((f) => `"${f}" ${build.flags[f] ? 1 : 0}`).join(", "),
  );
}

export function navigateExample(ex: LoadedExample): void {
  history.pushState(null, "", examplePath(ex.kind, ex.slug));
}
