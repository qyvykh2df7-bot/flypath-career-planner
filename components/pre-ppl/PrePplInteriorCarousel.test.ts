import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PRE_PPL_CAROUSEL_INTERVAL_MS,
  PrePplInteriorCarousel,
  resolvePrePplSwipeOffset,
} from "@/components/pre-ppl/PrePplInteriorCarousel";

describe("PrePplInteriorCarousel", () => {
  it("renders the three real Pre-PPL interiors with accessible controls", () => {
    const markup = renderToStaticMarkup(createElement(PrePplInteriorCarousel));

    expect(markup).toContain("Interiores de la guía Pre-PPL");
    expect(markup).toContain("cartas visuales de aproximación");
    expect(markup).toContain("walkaround y la entrada a cabina");
    expect(markup).toContain("checklist before take off");
    expect(markup).toContain("Ver interior anterior");
    expect(markup).toContain("Ver interior siguiente");
    expect(markup.match(/aria-pressed=/g)).toHaveLength(3);
    expect(markup).not.toContain('loading="lazy"');
    expect(markup.match(/loading="eager"/g)).toHaveLength(5);
    expect(markup).not.toContain("/_next/image?");
  });

  it("uses the approved four-second autoplay interval", () => {
    expect(PRE_PPL_CAROUSEL_INTERVAL_MS).toBe(4_000);
  });

  it("resolves deliberate horizontal swipes without hijacking vertical scroll", () => {
    expect(resolvePrePplSwipeOffset(-120, 12)).toBe(1);
    expect(resolvePrePplSwipeOffset(120, 12)).toBe(-1);
    expect(resolvePrePplSwipeOffset(-30, 4)).toBeNull();
    expect(resolvePrePplSwipeOffset(-90, 110)).toBeNull();
  });
});
