import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AeroCommsProGate } from "./AeroCommsProGate";

describe("AeroCommsProGate", () => {
  it("shows the locked-content explanation and upgrade route", () => {
    const markup = renderToStaticMarkup(createElement(AeroCommsProGate));

    expect(markup).toContain("Contenido de AeroComms Pro");
    expect(markup).toContain("Desbloquear AeroComms Pro");
    expect(markup).toContain('href="/aerocomms/app/paywall"');
  });
});
