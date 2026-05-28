/** Patrones CSS que html2canvas no puede parsear (Tailwind v4 usa lab/oklch). */
const UNSUPPORTED_COLOR_RE = /lab\(|\boklch\(|\bcolor-mix\(/i;

const COLOR_STYLE_PROPS = [
  "color",
  "background-color",
  "background",
  "background-image",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "fill",
  "stroke",
  "box-shadow",
  "text-shadow",
] as const;

/** Sustitutos RGB seguros (aprox. Tailwind slate / transparencias habituales). */
const LAB_FALLBACK_RGB = "rgb(100, 116, 139)";
const OKLCH_FALLBACK_RGB = "rgb(100, 116, 139)";
const COLOR_MIX_FALLBACK_RGBA = "rgba(15, 26, 51, 0.1)";

function needsColorFallback(value: string): boolean {
  return Boolean(value && UNSUPPORTED_COLOR_RE.test(value));
}

function patchUnsupportedCssText(css: string): string {
  return css
    .replace(/lab\([^)]*\)/gi, LAB_FALLBACK_RGB)
    .replace(/oklch\([^)]*\)/gi, OKLCH_FALLBACK_RGB)
    .replace(/color-mix\([^;)}]*\)/gi, COLOR_MIX_FALLBACK_RGBA);
}

function resolveCSSValue(win: Window, property: string, value: string): string | null {
  if (!value || !needsColorFallback(value)) return value;

  const doc = win.document;
  const probe = doc.createElement("div");
  probe.style.setProperty("position", "absolute");
  probe.style.setProperty("visibility", "hidden");
  probe.style.setProperty("pointer-events", "none");
  probe.style.setProperty(property, value);
  doc.body.appendChild(probe);

  let resolved = win.getComputedStyle(probe).getPropertyValue(property);
  probe.remove();

  if (resolved && !needsColorFallback(resolved)) return resolved;

  if (property.includes("shadow")) return "none";
  if (property.includes("image")) return "none";
  if (property === "background" || property === "background-color") return "transparent";

  return null;
}

function inlineSafeColorStyles(win: Window, root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const el of elements) {
    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK") continue;

    const computed = win.getComputedStyle(el);
    const inline = el.style;

    for (const prop of COLOR_STYLE_PROPS) {
      let value = computed.getPropertyValue(prop);
      if (!value || value === "none" || value === "initial") continue;

      if (needsColorFallback(value)) {
        const fixed = resolveCSSValue(win, prop, value);
        if (!fixed) continue;
        value = fixed;
      }

      try {
        inline.setProperty(prop, value, computed.getPropertyPriority(prop));
      } catch {
        /* ignore */
      }
    }
  }
}

/** Quita solo `<link>` externos del clone (suelen contener lab()); conserva `<style>` ya parcheados. */
function removeCloneExternalStylesheets(clonedDoc: Document): void {
  clonedDoc.querySelectorAll("link[rel='stylesheet']").forEach((node) => node.remove());
}

/**
 * Solo muta el documento clonado de html2canvas — nunca `document` real.
 */
export function prepareExportCloneForHtml2Canvas(
  clonedDoc: Document,
  clonedRoot: HTMLElement,
): void {
  if (clonedDoc === document) {
    throw new Error("FlyPath PDF: sanitización aplicada al documento real (abortado).");
  }

  const win = clonedDoc.defaultView;
  if (!win) return;

  clonedDoc.querySelectorAll("style").forEach((node) => {
    const style = node as HTMLStyleElement;
    if (style.textContent && UNSUPPORTED_COLOR_RE.test(style.textContent)) {
      style.textContent = patchUnsupportedCssText(style.textContent);
    }
  });

  inlineSafeColorStyles(win, clonedRoot);
  removeCloneExternalStylesheets(clonedDoc);
}
