export const CONTENT_OS_PLATFORMS = [
  "tiktok_pilotfeliu",
  "instagram_pilotfeliu",
  "instagram_flypath",
  "youtube",
] as const;

export const CONTENT_OS_OBJECTIVES = [
  "growth",
  "community",
  "authority",
  "conversion",
] as const;

export const CONTENT_OS_CATEGORIES = [
  "aviation",
  "personal_brand",
  "lifestyle",
  "sport",
] as const;

export const CONTENT_OS_IDEA_STATUSES = [
  "new",
  "approved",
  "production",
  "published",
  "discarded",
] as const;

export const CONTENT_OS_ITEM_STATUSES = [
  "draft",
  "review",
  "production",
  "scheduled",
  "published",
  "archived",
] as const;

export const CONTENT_OS_EVENT_TYPES = ["record", "edit", "publish"] as const;
export const CONTENT_OS_CALENDAR_VIEWS = ["week", "month"] as const;

export const CONTENT_OS_LIMITS = {
  ideaTitle: 160,
  ideaDescription: 5_000,
  itemTitle: 160,
  itemHook: 1_000,
  itemScript: 30_000,
  itemCta: 1_000,
  itemNotes: 10_000,
  itemSummary: 5_000,
  itemSourceUrl: 2_000,
  itemPillar: 100,
  calendarTitle: 160,
  calendarNotes: 5_000,
  metricValue: 1_000_000_000,
} as const;

export type ContentOsPlatform = (typeof CONTENT_OS_PLATFORMS)[number];
export type ContentOsObjective = (typeof CONTENT_OS_OBJECTIVES)[number];
export type ContentOsCategory = (typeof CONTENT_OS_CATEGORIES)[number];
export type ContentOsIdeaStatus = (typeof CONTENT_OS_IDEA_STATUSES)[number];
export type ContentOsItemStatus = (typeof CONTENT_OS_ITEM_STATUSES)[number];
export type ContentOsEventType = (typeof CONTENT_OS_EVENT_TYPES)[number];
export type ContentOsCalendarView = (typeof CONTENT_OS_CALENDAR_VIEWS)[number];
export type ContentOsProposalSource = "manual" | "ai";
export type ContentOsProposalStatus = "proposed" | "approved" | "rejected";

export type ContentOsIdea = {
  id: string;
  title: string;
  description: string;
  category: ContentOsCategory;
  platform: ContentOsPlatform;
  objective: ContentOsObjective;
  status: ContentOsIdeaStatus;
  proposalSource: ContentOsProposalSource;
  proposalStatus: ContentOsProposalStatus;
  strategyIdea: string | null;
  strategyHook: string | null;
  strategyPlatforms: ContentOsPlatform[];
  strategyFormat: string | null;
  strategyDurationSeconds: number | null;
  strategyProductKey: string | null;
  strategyCta: string | null;
  strategyPriority: string | null;
  strategyPillar: string | null;
  createdAt: string;
  updatedAt: string;
  contentItemId: string | null;
};

export type ContentOsMetricSnapshot = {
  id: string;
  contentItemId: string;
  recordedOn: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  leadsGenerated: number;
  salesAttributed: number;
  createdAt: string;
  updatedAt: string;
};

export type ContentOsMetricTotals = Omit<
  ContentOsMetricSnapshot,
  "id" | "contentItemId" | "recordedOn" | "createdAt" | "updatedAt"
>;

export type ContentOsItem = {
  id: string;
  sourceIdeaId: string | null;
  title: string;
  summary: string | null;
  platform:
    | ContentOsPlatform
    | "other";
  objective: ContentOsObjective | null;
  category: ContentOsCategory | null;
  hook: string;
  script: string;
  cta: string;
  notes: string | null;
  contentOrigin: "planned" | "historical";
  sourceUrl: string | null;
  contentPillar: string | null;
  relatedProductKey: string | null;
  status: ContentOsItemStatus;
  plannedRecordingOn: string | null;
  plannedPublishOn: string | null;
  publishedAt: string | null;
  proposalSource: ContentOsProposalSource;
  proposalStatus: ContentOsProposalStatus;
  createdAt: string;
  updatedAt: string;
  metricTotals: ContentOsMetricTotals;
};

export type ContentOsCalendarEvent = {
  id: string;
  contentItemId: string | null;
  contentTitle: string | null;
  title: string;
  eventType: ContentOsEventType;
  startsAt: string;
  endsAt: string;
  timezone: string;
  notes: string | null;
  proposalSource: ContentOsProposalSource;
  proposalStatus: ContentOsProposalStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContentOsItemDetail = {
  item: ContentOsItem;
  metrics: ContentOsMetricSnapshot[];
  calendarEvents: ContentOsCalendarEvent[];
};

export type ContentOsIdeaInput = {
  title: string;
  description: string;
  category: ContentOsCategory;
  platform: ContentOsPlatform;
  objective: ContentOsObjective;
  status: ContentOsIdeaStatus;
};

export type ContentOsItemInput = {
  title: string;
  platform: ContentOsPlatform;
  objective: ContentOsObjective;
  category: ContentOsCategory | null;
  hook: string;
  script: string;
  cta: string;
  notes: string | null;
  status: ContentOsItemStatus;
  plannedRecordingOn: string | null;
  plannedPublishOn: string | null;
};

export type ContentOsCalendarEventInput = {
  contentItemId: string | null;
  title: string;
  eventType: ContentOsEventType;
  startsAt: string;
  endsAt: string;
  timezone: "Europe/Madrid";
  notes: string | null;
};

export type ContentOsMetricInput = {
  recordedOn: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  leadsGenerated: number;
  salesAttributed: number;
};

export type ContentOsCalendarParameters = {
  view: ContentOsCalendarView;
  anchorDate: string;
  rangeStart: string;
  rangeEnd: string;
  days: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export const CONTENT_OS_EMPTY_METRICS: ContentOsMetricTotals = {
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  followersGained: 0,
  leadsGenerated: 0,
  salesAttributed: 0,
};

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function boundedText(
  value: string,
  options: { min?: number; max: number; nullable?: boolean },
): string | null | undefined {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return options.nullable ? null : undefined;
  if (normalized.length < (options.min ?? 1) || normalized.length > options.max) {
    return undefined;
  }
  return normalized;
}

function nullableDate(value: string): string | null | undefined {
  if (!value) return null;
  return isContentOsDate(value) ? value : undefined;
}

function nonnegativeInteger(value: string, max = CONTENT_OS_LIMITS.metricValue): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= max ? parsed : undefined;
}

function addUtcDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayForDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  const day = date.getUTCDay();
  return addUtcDays(value, day === 0 ? -6 : 1 - day);
}

function monthStartForDate(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

function monthEndForDate(value: string): string {
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

function madridToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function madridParts(timestamp: number): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function madridOffsetMs(timestamp: number): number {
  const parts = madridParts(timestamp);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - timestamp
  );
}

export function contentOsMadridLocalDateTimeToIso(value: string): string | null {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const requestedAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  let timestamp = requestedAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    timestamp = requestedAsUtc - madridOffsetMs(timestamp);
  }

  const resolved = madridParts(timestamp);
  if (
    resolved.year !== Number(year) ||
    resolved.month !== Number(month) ||
    resolved.day !== Number(day) ||
    resolved.hour !== Number(hour) ||
    resolved.minute !== Number(minute)
  ) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function contentOsTimestamp(value: string): string | null {
  const madridTimestamp = contentOsMadridLocalDateTimeToIso(value);
  if (madridTimestamp) return madridTimestamp;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

export function isContentOsUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isContentOsDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseContentOsIdeaForm(formData: FormData): ContentOsIdeaInput | null {
  const title = boundedText(formString(formData, "title"), { max: CONTENT_OS_LIMITS.ideaTitle });
  const description = boundedText(formString(formData, "description"), {
    max: CONTENT_OS_LIMITS.ideaDescription,
  });
  const category = formString(formData, "category");
  const platform = formString(formData, "platform");
  const objective = formString(formData, "objective");
  const status = formString(formData, "status") || "new";

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    !includesValue(CONTENT_OS_CATEGORIES, category) ||
    !includesValue(CONTENT_OS_PLATFORMS, platform) ||
    !includesValue(CONTENT_OS_OBJECTIVES, objective) ||
    !includesValue(CONTENT_OS_IDEA_STATUSES, status)
  ) {
    return null;
  }

  return { title, description, category, platform, objective, status };
}

export function parseContentOsItemForm(formData: FormData): ContentOsItemInput | null {
  const title = boundedText(formString(formData, "title"), { max: CONTENT_OS_LIMITS.itemTitle });
  const hook = boundedText(formString(formData, "hook"), { max: CONTENT_OS_LIMITS.itemHook });
  const script = boundedText(formString(formData, "script"), { max: CONTENT_OS_LIMITS.itemScript });
  const cta = boundedText(formString(formData, "cta"), { max: CONTENT_OS_LIMITS.itemCta });
  const notes = boundedText(formString(formData, "notes"), {
    max: CONTENT_OS_LIMITS.itemNotes,
    nullable: true,
  });
  const platform = formString(formData, "platform");
  const objective = formString(formData, "objective");
  const categoryValue = formString(formData, "category");
  const status = formString(formData, "status") || "draft";
  const plannedRecordingOn = nullableDate(formString(formData, "plannedRecordingOn"));
  const plannedPublishOn = nullableDate(formString(formData, "plannedPublishOn"));
  const category = categoryValue
    ? includesValue(CONTENT_OS_CATEGORIES, categoryValue)
      ? categoryValue
      : undefined
    : null;

  if (
    typeof title !== "string" ||
    typeof hook !== "string" ||
    typeof script !== "string" ||
    typeof cta !== "string" ||
    notes === undefined ||
    !includesValue(CONTENT_OS_PLATFORMS, platform) ||
    !includesValue(CONTENT_OS_OBJECTIVES, objective) ||
    category === undefined ||
    !includesValue(CONTENT_OS_ITEM_STATUSES, status) ||
    plannedRecordingOn === undefined ||
    plannedPublishOn === undefined ||
    (plannedRecordingOn &&
      plannedPublishOn &&
      plannedRecordingOn > plannedPublishOn)
  ) {
    return null;
  }

  return {
    title,
    platform,
    objective,
    category,
    hook,
    script,
    cta,
    notes,
    status,
    plannedRecordingOn,
    plannedPublishOn,
  };
}

export function parseContentOsCalendarEventForm(
  formData: FormData,
): ContentOsCalendarEventInput | null {
  const title = boundedText(formString(formData, "title"), {
    max: CONTENT_OS_LIMITS.calendarTitle,
  });
  const contentItemIdValue = formString(formData, "contentItemId");
  const eventType = formString(formData, "eventType");
  const startsAt = formString(formData, "startsAt");
  const endsAt = formString(formData, "endsAt");
  const notes = boundedText(formString(formData, "notes"), {
    max: CONTENT_OS_LIMITS.calendarNotes,
    nullable: true,
  });
  const contentItemId = contentItemIdValue
    ? isContentOsUuid(contentItemIdValue)
      ? contentItemIdValue
      : undefined
    : null;
  const normalizedStartsAt = contentOsTimestamp(startsAt);
  const normalizedEndsAt = contentOsTimestamp(endsAt);
  const startTime = normalizedStartsAt ? new Date(normalizedStartsAt).getTime() : Number.NaN;
  const endTime = normalizedEndsAt ? new Date(normalizedEndsAt).getTime() : Number.NaN;

  if (
    typeof title !== "string" ||
    contentItemId === undefined ||
    !includesValue(CONTENT_OS_EVENT_TYPES, eventType) ||
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime ||
    endTime - startTime > 24 * 60 * 60 * 1000 ||
    notes === undefined
  ) {
    return null;
  }

  return {
    contentItemId,
    title,
    eventType,
    startsAt: normalizedStartsAt as string,
    endsAt: normalizedEndsAt as string,
    timezone: "Europe/Madrid",
    notes,
  };
}

export function parseContentOsMetricForm(formData: FormData): ContentOsMetricInput | null {
  const recordedOn = formString(formData, "recordedOn");
  const values = {
    views: nonnegativeInteger(formString(formData, "views")),
    likes: nonnegativeInteger(formString(formData, "likes")),
    comments: nonnegativeInteger(formString(formData, "comments")),
    shares: nonnegativeInteger(formString(formData, "shares")),
    saves: nonnegativeInteger(formString(formData, "saves")),
    followersGained: nonnegativeInteger(formString(formData, "followersGained")),
    leadsGenerated: nonnegativeInteger(formString(formData, "leadsGenerated")),
    salesAttributed: nonnegativeInteger(formString(formData, "salesAttributed")),
  };

  if (!isContentOsDate(recordedOn) || Object.values(values).some((value) => value === undefined)) {
    return null;
  }

  return {
    recordedOn,
    views: values.views as number,
    likes: values.likes as number,
    comments: values.comments as number,
    shares: values.shares as number,
    saves: values.saves as number,
    followersGained: values.followersGained as number,
    leadsGenerated: values.leadsGenerated as number,
    salesAttributed: values.salesAttributed as number,
  };
}

export function parseContentOsCalendarParameters(
  searchParams: Record<string, string | string[] | undefined>,
): ContentOsCalendarParameters {
  const viewValue = typeof searchParams.view === "string" ? searchParams.view : "";
  const dateValue = typeof searchParams.date === "string" ? searchParams.date : "";
  const view = includesValue(CONTENT_OS_CALENDAR_VIEWS, viewValue) ? viewValue : "week";
  const anchorDate = isContentOsDate(dateValue) ? dateValue : madridToday();

  if (view === "week") {
    const rangeStart = mondayForDate(anchorDate);
    const days = Array.from({ length: 7 }, (_, index) => addUtcDays(rangeStart, index));
    return {
      view,
      anchorDate,
      rangeStart,
      rangeEnd: addUtcDays(rangeStart, 7),
      days,
    };
  }

  const monthStart = monthStartForDate(anchorDate);
  const monthEnd = monthEndForDate(anchorDate);
  const gridStart = mondayForDate(monthStart);
  const endDate = addUtcDays(monthEnd, 1);
  const gridDays: string[] = [];
  for (let date = gridStart; date < endDate || gridDays.length % 7 !== 0; date = addUtcDays(date, 1)) {
    gridDays.push(date);
  }

  return {
    view,
    anchorDate,
    rangeStart: gridStart,
    rangeEnd: addUtcDays(gridDays.at(-1) ?? gridStart, 1),
    days: gridDays,
  };
}

export function getContentOsAdjacentDate(
  parameters: ContentOsCalendarParameters,
  direction: "previous" | "next",
): string {
  const amount = parameters.view === "week" ? 7 : 1;
  if (parameters.view === "week") {
    return addUtcDays(parameters.anchorDate, direction === "previous" ? -amount : amount);
  }

  const date = new Date(`${parameters.anchorDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + (direction === "previous" ? -amount : amount));
  return date.toISOString().slice(0, 10);
}

export function getLatestContentOsMetrics(
  snapshots: readonly ContentOsMetricSnapshot[],
): ContentOsMetricTotals {
  const latest = snapshots.reduce<ContentOsMetricSnapshot | null>(
    (current, snapshot) =>
      !current || snapshot.recordedOn > current.recordedOn ? snapshot : current,
    null,
  );
  if (!latest) return { ...CONTENT_OS_EMPTY_METRICS };
  return {
    views: latest.views,
    likes: latest.likes,
    comments: latest.comments,
    shares: latest.shares,
    saves: latest.saves,
    followersGained: latest.followersGained,
    leadsGenerated: latest.leadsGenerated,
    salesAttributed: latest.salesAttributed,
  };
}
