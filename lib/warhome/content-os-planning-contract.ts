import {
  CONTENT_OS_EVENT_TYPES,
  CONTENT_OS_LIMITS,
  contentOsMadridLocalDateTimeToIso,
  isContentOsDate,
  isContentOsUuid,
  type ContentOsEventType,
  type ContentOsIdea,
  type ContentOsItem,
} from "@/lib/warhome/content-os-contract";

export const CONTENT_OS_AVAILABILITY_TYPES = [
  "work",
  "rest",
  "travel",
  "recording_available",
] as const;

export const CONTENT_OS_PLANNING_PROPOSAL_STATUSES = [
  "proposed",
  "approved",
  "rejected",
] as const;

export const CONTENT_OS_PLANNING_LIMITS = {
  availabilityNotes: 5_000,
  proposalSummary: 5_000,
  proposalEvents: 30,
  planningDays: 14,
} as const;

export type ContentOsAvailabilityType =
  (typeof CONTENT_OS_AVAILABILITY_TYPES)[number];
export type ContentOsPlanningProposalStatus =
  (typeof CONTENT_OS_PLANNING_PROPOSAL_STATUSES)[number];
export type ContentOsPlanningDecision = Exclude<
  ContentOsPlanningProposalStatus,
  "proposed"
>;

export type ContentOsAvailabilitySlot = {
  id: string;
  availabilityType: ContentOsAvailabilityType;
  startsAt: string;
  endsAt: string;
  timezone: "Europe/Madrid";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentOsAvailabilityInput = Omit<
  ContentOsAvailabilitySlot,
  "id" | "createdAt" | "updatedAt"
>;

export type ContentOsPlanningProposalEvent = {
  id: string;
  contentItemId: string | null;
  contentIdeaId: string | null;
  title: string;
  eventType: ContentOsEventType;
  startsAt: string;
  endsAt: string;
  timezone: "Europe/Madrid";
  notes: string | null;
};

export type ContentOsPlanningProposal = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: ContentOsPlanningProposalStatus;
  summary: string;
  modelName: string;
  generatedAt: string;
  reviewedAt: string | null;
  events: ContentOsPlanningProposalEvent[];
};

export type ContentOsPlannerWorkspace = {
  periodStart: string;
  periodEnd: string;
  availability: ContentOsAvailabilitySlot[];
  ideas: Pick<ContentOsIdea, "id" | "title" | "platform" | "objective" | "status">[];
  items: Pick<
    ContentOsItem,
    "id" | "title" | "platform" | "objective" | "status"
  >[];
  proposals: ContentOsPlanningProposal[];
};

export type ContentOsAiPlanningSuggestion = {
  title: string;
  eventType: ContentOsEventType;
  startsAt: string;
  endsAt: string;
  contentItemId: string | null;
  contentIdeaId: string | null;
  notes: string | null;
};

export type ContentOsAiPlanningOutput = {
  summary: string;
  suggestions: ContentOsAiPlanningSuggestion[];
};

export type ContentOsAiPlanningContext = Omit<
  ContentOsPlannerWorkspace,
  "proposals"
>;

type ContentOsAvailabilityRange = Pick<
  ContentOsAvailabilityInput,
  "availabilityType" | "startsAt" | "endsAt"
>;

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

function validTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(new Date(value).getTime())
  );
}

function madridDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function contentOsIntervalsOverlap(
  firstStartsAt: string,
  firstEndsAt: string,
  secondStartsAt: string,
  secondEndsAt: string,
): boolean {
  return (
    new Date(firstStartsAt).getTime() < new Date(secondEndsAt).getTime() &&
    new Date(firstEndsAt).getTime() > new Date(secondStartsAt).getTime()
  );
}

export function contentOsAvailabilitySlotsConflict(
  first: ContentOsAvailabilityRange,
  second: ContentOsAvailabilityRange,
): boolean {
  if (
    !contentOsIntervalsOverlap(
      first.startsAt,
      first.endsAt,
      second.startsAt,
      second.endsAt,
    )
  ) {
    return false;
  }

  return (
    first.availabilityType === second.availabilityType ||
    first.availabilityType === "work" ||
    first.availabilityType === "travel" ||
    second.availabilityType === "work" ||
    second.availabilityType === "travel"
  );
}

export function contentOsPlanningSuggestionsOverlap(
  suggestions: readonly ContentOsAiPlanningSuggestion[],
): boolean {
  return suggestions.some((suggestion, index) =>
    suggestions.slice(index + 1).some((other) =>
      contentOsIntervalsOverlap(
        suggestion.startsAt,
        suggestion.endsAt,
        other.startsAt,
        other.endsAt,
      ),
    ),
  );
}

export function parseContentOsAvailabilityForm(
  formData: FormData,
): ContentOsAvailabilityInput | null {
  const availabilityType = formString(formData, "availabilityType");
  const startsAtValue = formString(formData, "startsAt");
  const endsAtValue = formString(formData, "endsAt");
  const notesValue = formString(formData, "notes").replace(/\r\n/g, "\n");

  if (
    !includesValue(CONTENT_OS_AVAILABILITY_TYPES, availabilityType) ||
    !LOCAL_DATE_TIME_PATTERN.test(startsAtValue) ||
    !LOCAL_DATE_TIME_PATTERN.test(endsAtValue) ||
    notesValue.length > CONTENT_OS_PLANNING_LIMITS.availabilityNotes
  ) {
    return null;
  }

  const startsAt = contentOsMadridLocalDateTimeToIso(startsAtValue);
  const endsAt = contentOsMadridLocalDateTimeToIso(endsAtValue);
  if (!startsAt || !endsAt) return null;

  const duration = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (duration <= 0 || duration > 31 * 24 * 60 * 60 * 1_000) return null;

  return {
    availabilityType,
    startsAt,
    endsAt,
    timezone: "Europe/Madrid",
    notes: notesValue || null,
  };
}

export function parseContentOsPlanningOutput(
  value: unknown,
  context: ContentOsAiPlanningContext,
): ContentOsAiPlanningOutput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const summary =
    typeof candidate.summary === "string" ? candidate.summary.trim() : "";
  if (
    !summary ||
    summary.length > CONTENT_OS_PLANNING_LIMITS.proposalSummary ||
    !Array.isArray(candidate.suggestions) ||
    candidate.suggestions.length < 1 ||
    candidate.suggestions.length > CONTENT_OS_PLANNING_LIMITS.proposalEvents
  ) {
    return null;
  }

  const itemIds = new Set(context.items.map((item) => item.id));
  const ideaIds = new Set(context.ideas.map((idea) => idea.id));
  const suggestions: ContentOsAiPlanningSuggestion[] = [];

  for (const rawSuggestion of candidate.suggestions) {
    if (
      !rawSuggestion ||
      typeof rawSuggestion !== "object" ||
      Array.isArray(rawSuggestion)
    ) {
      return null;
    }
    const suggestion = rawSuggestion as Record<string, unknown>;
    const title =
      typeof suggestion.title === "string" ? suggestion.title.trim() : "";
    const eventType =
      typeof suggestion.eventType === "string" ? suggestion.eventType : "";
    const contentItemId =
      suggestion.contentItemId === null ? null : suggestion.contentItemId;
    const contentIdeaId =
      suggestion.contentIdeaId === null ? null : suggestion.contentIdeaId;
    const notes =
      suggestion.notes === null
        ? null
        : typeof suggestion.notes === "string"
          ? suggestion.notes.trim() || null
          : undefined;

    if (
      !title ||
      title.length > CONTENT_OS_LIMITS.calendarTitle ||
      !includesValue(CONTENT_OS_EVENT_TYPES, eventType) ||
      !validTimestamp(suggestion.startsAt) ||
      !validTimestamp(suggestion.endsAt) ||
      (contentItemId !== null &&
        (typeof contentItemId !== "string" ||
          !isContentOsUuid(contentItemId) ||
          !itemIds.has(contentItemId))) ||
      (contentIdeaId !== null &&
        (typeof contentIdeaId !== "string" ||
          !isContentOsUuid(contentIdeaId) ||
          !ideaIds.has(contentIdeaId))) ||
      (contentItemId === null && contentIdeaId === null) ||
      notes === undefined ||
      (notes?.length ?? 0) > CONTENT_OS_LIMITS.calendarNotes
    ) {
      return null;
    }

    const startsAt = suggestion.startsAt as string;
    const endsAt = suggestion.endsAt as string;
    const duration = new Date(endsAt).getTime() - new Date(startsAt).getTime();
    const date = madridDate(startsAt);
    if (
      duration <= 0 ||
      duration > 24 * 60 * 60 * 1_000 ||
      date < context.periodStart ||
      date > context.periodEnd
    ) {
      return null;
    }

    suggestions.push({
      title,
      eventType,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      contentItemId: contentItemId as string | null,
      contentIdeaId: contentIdeaId as string | null,
      notes,
    });
  }

  if (contentOsPlanningSuggestionsOverlap(suggestions)) return null;

  return { summary, suggestions };
}

export function isContentOsPlanningDecision(
  value: string,
): value is ContentOsPlanningDecision {
  return value === "approved" || value === "rejected";
}

export function isContentOsPlanningPeriod(
  start: string,
  end: string,
): boolean {
  if (!isContentOsDate(start) || !isContentOsDate(end)) return false;
  const duration =
    new Date(`${end}T00:00:00.000Z`).getTime() -
    new Date(`${start}T00:00:00.000Z`).getTime();
  return duration >= 0 && duration <= 13 * 24 * 60 * 60 * 1_000;
}
