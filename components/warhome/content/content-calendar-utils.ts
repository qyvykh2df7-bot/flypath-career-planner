import {
  contentOsMadridLocalDateTimeToIso,
  type ContentOsCalendarEvent,
} from "@/lib/warhome/content-os-contract";

export const CONTENT_OS_CALENDAR_START_HOUR = 7;
export const CONTENT_OS_CALENDAR_END_HOUR = 23;
export const CONTENT_OS_CALENDAR_SLOT_HEIGHT = 40;

export function contentOsMadridDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function contentOsMadridTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function eventDurationMs(event: ContentOsCalendarEvent): number {
  return new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
}

export function getContentOsQuickCreateRange(
  targetDate: string,
  targetHour = 10,
): { startsAt: string; endsAt: string } | null {
  const localStart = `${targetDate}T${String(targetHour).padStart(2, "0")}:00`;
  const startsAt = contentOsMadridLocalDateTimeToIso(localStart);
  if (!startsAt) return null;

  return {
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
  };
}

export function moveContentOsEventToSlot(
  event: ContentOsCalendarEvent,
  targetDate: string,
  targetHour?: number,
): { startsAt: string; endsAt: string } | null {
  const targetTime =
    targetHour === undefined
      ? contentOsMadridTime(event.startsAt)
      : `${String(targetHour).padStart(2, "0")}:00`;
  const startsAt = contentOsMadridLocalDateTimeToIso(`${targetDate}T${targetTime}`);
  const duration = eventDurationMs(event);
  if (!startsAt || duration <= 0) return null;

  return {
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + duration).toISOString(),
  };
}

export function getContentOsWeekEventLayout(
  event: ContentOsCalendarEvent,
): { top: number; height: number } {
  const [hours, minutes] = contentOsMadridTime(event.startsAt)
    .split(":")
    .map(Number);
  const calendarStartMinutes = CONTENT_OS_CALENDAR_START_HOUR * 60;
  const calendarEndMinutes = CONTENT_OS_CALENDAR_END_HOUR * 60;
  const eventStartMinutes = hours * 60 + minutes;
  const durationMinutes = eventDurationMs(event) / (60 * 1000);
  const totalHeight =
    (CONTENT_OS_CALENDAR_END_HOUR - CONTENT_OS_CALENDAR_START_HOUR) *
    CONTENT_OS_CALENDAR_SLOT_HEIGHT;
  const visibleStart = Math.min(
    calendarEndMinutes,
    Math.max(calendarStartMinutes, eventStartMinutes),
  );
  const visibleEnd = Math.max(
    visibleStart,
    Math.min(calendarEndMinutes, eventStartMinutes + durationMinutes),
  );
  const rawTop =
    ((visibleStart - calendarStartMinutes) / 60) *
    CONTENT_OS_CALENDAR_SLOT_HEIGHT;
  const top = Math.min(Math.max(0, totalHeight - 36), rawTop);

  return {
    top,
    height: Math.min(
      totalHeight - top,
      Math.max(
        36,
        ((visibleEnd - visibleStart) / 60) *
          CONTENT_OS_CALENDAR_SLOT_HEIGHT,
      ),
    ),
  };
}
