import { describe, expect, it } from "vitest";
import { getDashboardWeekBadge } from "./dashboard-week-badge";

describe("getDashboardWeekBadge", () => {
  it("0–20% en ritmo → copy neutral", () => {
    expect(getDashboardWeekBadge("on_track", 0).label).toBe("Semana en marcha");
    expect(getDashboardWeekBadge("on_track", 8).label).toBe("Ritmo inicial");
    expect(getDashboardWeekBadge("on_track", 20).label).toBe("Ritmo inicial");
  });

  it("inicio con behind/critical → no copy agresivo", () => {
    expect(getDashboardWeekBadge("behind", 8).label).toBe("Ritmo inicial");
    expect(getDashboardWeekBadge("critical", 8).label).toBe("Ritmo inicial");
    expect(getDashboardWeekBadge("behind", 0).label).toBe("Semana en marcha");
  });

  it("21–50% → Buen ritmo", () => {
    expect(getDashboardWeekBadge("on_track", 21).label).toBe("Buen ritmo");
    expect(getDashboardWeekBadge("on_track", 40).label).toBe("Buen ritmo");
  });

  it("51–80% → Avanzando bien", () => {
    expect(getDashboardWeekBadge("on_track", 55).label).toBe("Avanzando bien");
    expect(getDashboardWeekBadge("on_track", 80).label).toBe("Avanzando bien");
  });

  it("81–99% → Casi completada", () => {
    expect(getDashboardWeekBadge("on_track", 85).label).toBe("Casi completada");
    expect(getDashboardWeekBadge("on_track", 99).label).toBe("Casi completada");
  });

  it("100% → Semana completada", () => {
    expect(getDashboardWeekBadge("on_track", 100).label).toBe("Semana completada");
  });

  it("retraso claro → Revisa el ritmo", () => {
    expect(getDashboardWeekBadge("behind", 25).label).toBe("Revisa el ritmo");
    expect(getDashboardWeekBadge("slightly_behind", 35).label).toBe("Revisa el ritmo");
  });

  it("ligero retraso al inicio → Ritmo inicial, no agresivo", () => {
    expect(getDashboardWeekBadge("slightly_behind", 10).label).toBe("Ritmo inicial");
  });

  it("critical con avance claro → Te estás quedando atrás", () => {
    expect(getDashboardWeekBadge("critical", 35).label).toBe("Te estás quedando atrás");
  });
});
