import { describe, expect, it } from "vitest";
import {
  contentOsMadridLocalDateTimeToIso,
  type ContentOsCalendarEvent,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_CALENDAR_SLOT_HEIGHT,
  CONTENT_OS_CALENDAR_START_HOUR,
  contentOsMadridDate,
  contentOsMadridTime,
  getContentOsQuickCreateRange,
  getContentOsWeekEventLayout,
  moveContentOsEventToSlot,
} from "./content-calendar-utils";

function calendarEvent(
  startsAtLocal: string,
  endsAtLocal: string,
): ContentOsCalendarEvent {
  const startsAt = contentOsMadridLocalDateTimeToIso(startsAtLocal);
  const endsAt = contentOsMadridLocalDateTimeToIso(endsAtLocal);
  if (!startsAt || !endsAt) throw new Error("Invalid test fixture");

  return {
    id: "11111111-1111-4111-8111-111111111111",
    contentItemId: "22222222-2222-4222-8222-222222222222",
    contentTitle: "Vida de piloto",
    title: "Grabar vídeo",
    eventType: "record",
    startsAt,
    endsAt,
    timezone: "Europe/Madrid",
    notes: null,
    proposalSource: "manual",
    proposalStatus: "approved",
    createdAt: startsAt,
    updatedAt: startsAt,
  };
}

describe("Content OS calendar interactions", () => {
  it("prepares a one-hour quick-create range from an empty slot", () => {
    const range = getContentOsQuickCreateRange("2026-07-29", 14);

    expect(range).not.toBeNull();
    expect(contentOsMadridDate(range!.startsAt)).toBe("2026-07-29");
    expect(contentOsMadridTime(range!.startsAt)).toBe("14:00");
    expect(contentOsMadridTime(range!.endsAt)).toBe("15:00");
  });

  it("moves an event to a day and hour while preserving its duration", () => {
    const event = calendarEvent("2026-07-29T10:30", "2026-07-29T12:00");
    const moved = moveContentOsEventToSlot(event, "2026-07-31", 16);

    expect(moved).not.toBeNull();
    expect(contentOsMadridDate(moved!.startsAt)).toBe("2026-07-31");
    expect(contentOsMadridTime(moved!.startsAt)).toBe("16:00");
    expect(
      new Date(moved!.endsAt).getTime() - new Date(moved!.startsAt).getTime(),
    ).toBe(90 * 60 * 1000);
  });

  it("preserves the local time when an event moves in month view", () => {
    const event = calendarEvent("2026-07-29T10:30", "2026-07-29T11:30");
    const moved = moveContentOsEventToSlot(event, "2026-08-03");

    expect(moved).not.toBeNull();
    expect(contentOsMadridDate(moved!.startsAt)).toBe("2026-08-03");
    expect(contentOsMadridTime(moved!.startsAt)).toBe("10:30");
  });

  it("positions an event against the weekly hour grid", () => {
    const event = calendarEvent("2026-07-29T08:30", "2026-07-29T09:45");
    const layout = getContentOsWeekEventLayout(event);

    expect(layout.top).toBe(
      CONTENT_OS_CALENDAR_SLOT_HEIGHT * (8.5 - CONTENT_OS_CALENDAR_START_HOUR),
    );
    expect(layout.height).toBe(CONTENT_OS_CALENDAR_SLOT_HEIGHT * 1.25);
  });
});
