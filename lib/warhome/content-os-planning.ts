import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";
import {
  ContentOsDataError,
  ContentOsNotFoundError,
  getContentOsIdeas,
  getContentOsLibrary,
} from "@/lib/warhome/content-os";
import { generateContentOsPlanningProposal } from "@/lib/warhome/content-os-ai-planner";
import {
  CONTENT_OS_AVAILABILITY_TYPES,
  CONTENT_OS_PLANNING_PROPOSAL_STATUSES,
  contentOsAvailabilitySlotsConflict,
  isContentOsPlanningDecision,
  isContentOsPlanningPeriod,
  type ContentOsAvailabilityInput,
  type ContentOsAvailabilitySlot,
  type ContentOsAvailabilityType,
  type ContentOsPlannerWorkspace,
  type ContentOsPlanningDecision,
  type ContentOsPlanningProposal,
  type ContentOsPlanningProposalEvent,
  type ContentOsPlanningProposalStatus,
} from "@/lib/warhome/content-os-planning-contract";
import {
  CONTENT_OS_EVENT_TYPES,
  contentOsMadridLocalDateTimeToIso,
  isContentOsDate,
  isContentOsUuid,
  type ContentOsEventType,
} from "@/lib/warhome/content-os-contract";

const CONTENT_OS_WORKSPACE_KEY = "pilotfeliu";
const CONTENT_OS_TIMEZONE = "Europe/Madrid";
const DEFAULT_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS = 60;
const MIN_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS = 15;
const MAX_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS = 3_600;
const AVAILABILITY_SELECT =
  "id,availability_type,starts_at,ends_at,timezone,notes,created_at,updated_at";
const PROPOSAL_SELECT =
  "id,period_start,period_end,status,summary,model_name,generated_at,reviewed_at";
const PROPOSAL_EVENT_SELECT =
  "id,proposal_id,content_item_id,content_idea_id,title,event_type,starts_at,ends_at,timezone,notes";

type RawRecord = Record<string, unknown>;

export class ContentOsPlannerRateLimitError extends Error {
  constructor() {
    super("Content OS planner rate limit reached");
    this.name = "ContentOsPlannerRateLimitError";
  }
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return Number.isFinite(new Date(value).getTime()) ? value : null;
}

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

function madridDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CONTENT_OS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getContentOsPlannerMinIntervalSeconds(
  value = process.env.CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS,
): number {
  if (!value || !/^\d+$/.test(value)) {
    return DEFAULT_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return DEFAULT_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS;
  }

  return Math.min(
    MAX_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS,
    Math.max(MIN_CONTENT_OS_PLANNER_MIN_INTERVAL_SECONDS, parsed),
  );
}

function mapAvailability(value: unknown): ContentOsAvailabilitySlot | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const availabilityType = text(row.availability_type);
  const startsAt = timestamp(row.starts_at);
  const endsAt = timestamp(row.ends_at);
  const timezone = text(row.timezone);
  const createdAt = timestamp(row.created_at);
  const updatedAt = timestamp(row.updated_at);
  if (
    !id ||
    !isContentOsUuid(id) ||
    !includesValue(CONTENT_OS_AVAILABILITY_TYPES, availabilityType ?? "") ||
    !startsAt ||
    !endsAt ||
    new Date(endsAt).getTime() <= new Date(startsAt).getTime() ||
    timezone !== CONTENT_OS_TIMEZONE ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    availabilityType: availabilityType as ContentOsAvailabilityType,
    startsAt,
    endsAt,
    timezone: CONTENT_OS_TIMEZONE,
    notes: optionalText(row.notes),
    createdAt,
    updatedAt,
  };
}

function mapProposalEvent(value: unknown): ContentOsPlanningProposalEvent | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const title = text(row.title);
  const eventType = text(row.event_type);
  const startsAt = timestamp(row.starts_at);
  const endsAt = timestamp(row.ends_at);
  const timezone = text(row.timezone);
  const contentItemId = optionalText(row.content_item_id);
  const contentIdeaId = optionalText(row.content_idea_id);
  if (
    !id ||
    !isContentOsUuid(id) ||
    !title?.trim() ||
    !includesValue(CONTENT_OS_EVENT_TYPES, eventType ?? "") ||
    !startsAt ||
    !endsAt ||
    new Date(endsAt).getTime() <= new Date(startsAt).getTime() ||
    timezone !== CONTENT_OS_TIMEZONE
  ) {
    return null;
  }

  return {
    id,
    contentItemId,
    contentIdeaId,
    title,
    eventType: eventType as ContentOsEventType,
    startsAt,
    endsAt,
    timezone: CONTENT_OS_TIMEZONE,
    notes: optionalText(row.notes),
  };
}

function mapProposal(
  value: unknown,
  events: readonly ContentOsPlanningProposalEvent[],
): ContentOsPlanningProposal | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const id = text(row.id);
  const periodStart = text(row.period_start);
  const periodEnd = text(row.period_end);
  const status = text(row.status);
  const summary = text(row.summary);
  const modelName = text(row.model_name);
  const generatedAt = timestamp(row.generated_at);
  const reviewedAt =
    row.reviewed_at === null ? null : timestamp(row.reviewed_at);
  if (
    !id ||
    !isContentOsUuid(id) ||
    !isContentOsPlanningPeriod(periodStart ?? "", periodEnd ?? "") ||
    !includesValue(CONTENT_OS_PLANNING_PROPOSAL_STATUSES, status ?? "") ||
    !summary?.trim() ||
    !modelName?.trim() ||
    !generatedAt ||
    (row.reviewed_at !== null && !reviewedAt)
  ) {
    return null;
  }

  return {
    id,
    periodStart: periodStart as string,
    periodEnd: periodEnd as string,
    status: status as ContentOsPlanningProposalStatus,
    summary,
    modelName,
    generatedAt,
    reviewedAt,
    events: [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}

async function loadContentOsAvailability(
  rangeStart: string,
  rangeEnd: string,
): Promise<ContentOsAvailabilitySlot[]> {
  const from = contentOsMadridLocalDateTimeToIso(`${rangeStart}T00:00`);
  const until = contentOsMadridLocalDateTimeToIso(
    `${addDays(rangeEnd, 1)}T00:00`,
  );
  if (!from || !until) throw new ContentOsDataError();
  const { data, error } = await getSupabaseAdmin()
    .from("content_availability_slots")
    .select(AVAILABILITY_SELECT)
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .lt("starts_at", until)
    .gt("ends_at", from)
    .order("starts_at", { ascending: true })
    .limit(500);
  if (error || !Array.isArray(data)) throw new ContentOsDataError();
  return data.map((row) => {
    const slot = mapAvailability(row);
    if (!slot) throw new ContentOsDataError();
    return slot;
  });
}

async function assertContentOsAvailabilityDoesNotConflict(
  input: ContentOsAvailabilityInput,
  excludedSlotId?: string,
): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from("content_availability_slots")
    .select(AVAILABILITY_SELECT)
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .lt("starts_at", input.endsAt)
    .gt("ends_at", input.startsAt)
    .limit(500);
  if (error || !Array.isArray(data)) throw new ContentOsDataError();

  for (const row of data) {
    const slot = mapAvailability(row);
    if (!slot) throw new ContentOsDataError();
    if (
      slot.id !== excludedSlotId &&
      contentOsAvailabilitySlotsConflict(input, slot)
    ) {
      throw new ContentOsDataError();
    }
  }
}

async function claimContentOsPlannerGeneration(adminUserId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "claim_content_os_planning_generation",
    {
      p_admin_user_id: adminUserId,
      p_min_interval_seconds: getContentOsPlannerMinIntervalSeconds(),
    },
  );
  if (!error) return;
  if (error.message.includes("content_os_planner_rate_limited")) {
    throw new ContentOsPlannerRateLimitError();
  }
  throw new ContentOsDataError();
}

async function loadContentOsProposals(): Promise<ContentOsPlanningProposal[]> {
  const admin = getSupabaseAdmin();
  const proposalsResult = await admin
    .from("content_planning_proposals")
    .select(PROPOSAL_SELECT)
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .order("generated_at", { ascending: false })
    .limit(20);
  if (proposalsResult.error || !Array.isArray(proposalsResult.data)) {
    throw new ContentOsDataError();
  }

  const proposalIds = proposalsResult.data.flatMap((row) => {
    const id = isRecord(row) ? text(row.id) : null;
    return id && isContentOsUuid(id) ? [id] : [];
  });
  if (proposalIds.length !== proposalsResult.data.length) {
    throw new ContentOsDataError();
  }

  const eventsResult = proposalIds.length
    ? await admin
        .from("content_planning_proposal_events")
        .select(PROPOSAL_EVENT_SELECT)
        .in("proposal_id", proposalIds)
        .order("starts_at", { ascending: true })
    : { data: [], error: null };
  if (eventsResult.error || !Array.isArray(eventsResult.data)) {
    throw new ContentOsDataError();
  }

  const eventsByProposal = new Map<string, ContentOsPlanningProposalEvent[]>();
  for (const row of eventsResult.data) {
    const proposalId = isRecord(row) ? text(row.proposal_id) : null;
    const event = mapProposalEvent(row);
    if (!proposalId || !event) throw new ContentOsDataError();
    eventsByProposal.set(proposalId, [
      ...(eventsByProposal.get(proposalId) ?? []),
      event,
    ]);
  }

  return proposalsResult.data.map((row) => {
    const id = isRecord(row) ? text(row.id) : null;
    const proposal = mapProposal(row, id ? eventsByProposal.get(id) ?? [] : []);
    if (!proposal) throw new ContentOsDataError();
    return proposal;
  });
}

async function loadPlannerContext(): Promise<
  Omit<ContentOsPlannerWorkspace, "proposals">
> {
  const periodStart = madridDate(new Date());
  const periodEnd = addDays(periodStart, 13);
  const [availability, ideas, items] = await Promise.all([
    loadContentOsAvailability(periodStart, periodEnd),
    getContentOsIdeas(),
    getContentOsLibrary(),
  ]);

  return {
    periodStart,
    periodEnd,
    availability,
    ideas: ideas
      .filter((idea) => idea.status !== "discarded")
      .slice(0, 100)
      .map(({ id, title, platform, objective, status }) => ({
        id,
        title,
        platform,
        objective,
        status,
      })),
    items: items
      .filter(
        (item) => item.status !== "published" && item.status !== "archived",
      )
      .slice(0, 100)
      .map(({ id, title, platform, objective, status }) => ({
        id,
        title,
        platform,
        objective,
        status,
      })),
  };
}

export async function getContentOsAvailability(
  rangeStart?: string,
  rangeEnd?: string,
): Promise<ContentOsAvailabilitySlot[]> {
  await requireWarhomeAdmin();
  const start =
    rangeStart && isContentOsDate(rangeStart) ? rangeStart : madridDate(new Date());
  const end =
    rangeEnd && isContentOsDate(rangeEnd) ? rangeEnd : addDays(start, 90);
  if (end < start) throw new ContentOsDataError();
  return loadContentOsAvailability(start, end);
}

export async function createContentOsAvailability(
  input: ContentOsAvailabilityInput,
): Promise<string> {
  const adminUser = await requireWarhomeAdmin();
  await assertContentOsAvailabilityDoesNotConflict(input);
  const { data, error } = await getSupabaseAdmin()
    .from("content_availability_slots")
    .insert({
      workspace_key: CONTENT_OS_WORKSPACE_KEY,
      availability_type: input.availabilityType,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone,
      notes: input.notes,
      created_by: adminUser.userId,
      updated_by: adminUser.userId,
    })
    .select("id")
    .single();
  if (error || !isRecord(data) || !isContentOsUuid(String(data.id))) {
    throw new ContentOsDataError();
  }
  return String(data.id);
}

export async function updateContentOsAvailability(
  slotId: string,
  input: ContentOsAvailabilityInput,
): Promise<void> {
  const adminUser = await requireWarhomeAdmin();
  if (!isContentOsUuid(slotId)) throw new ContentOsNotFoundError();
  await assertContentOsAvailabilityDoesNotConflict(input, slotId);
  const { data, error } = await getSupabaseAdmin()
    .from("content_availability_slots")
    .update({
      availability_type: input.availabilityType,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone,
      notes: input.notes,
      updated_by: adminUser.userId,
    })
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", slotId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function deleteContentOsAvailability(slotId: string): Promise<void> {
  await requireWarhomeAdmin();
  if (!isContentOsUuid(slotId)) throw new ContentOsNotFoundError();
  const { data, error } = await getSupabaseAdmin()
    .from("content_availability_slots")
    .delete()
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .eq("id", slotId)
    .select("id")
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) throw new ContentOsNotFoundError();
}

export async function getContentOsPlannerWorkspace(): Promise<ContentOsPlannerWorkspace> {
  await requireWarhomeAdmin();
  const [context, proposals] = await Promise.all([
    loadPlannerContext(),
    loadContentOsProposals(),
  ]);
  return { ...context, proposals };
}

export async function createContentOsAiProposal(): Promise<string> {
  const adminUser = await requireWarhomeAdmin();
  const context = await loadPlannerContext();
  if (
    !context.availability.some(
      (slot) =>
        slot.availabilityType === "rest" ||
        slot.availabilityType === "recording_available",
    ) ||
    (!context.ideas.length && !context.items.length)
  ) {
    throw new ContentOsDataError();
  }

  await claimContentOsPlannerGeneration(adminUser.userId);

  const { model, output } =
    await generateContentOsPlanningProposal(context);
  const inputHash = createHash("sha256")
    .update(JSON.stringify(context))
    .digest("hex");
  const { data, error } = await getSupabaseAdmin().rpc(
    "create_content_os_planning_proposal",
    {
      p_admin_user_id: adminUser.userId,
      p_period_start: context.periodStart,
      p_period_end: context.periodEnd,
      p_summary: output.summary,
      p_model_name: model,
      p_input_hash: inputHash,
      p_suggestions: output.suggestions.map((suggestion) => ({
        title: suggestion.title,
        event_type: suggestion.eventType,
        starts_at: suggestion.startsAt,
        ends_at: suggestion.endsAt,
        content_item_id: suggestion.contentItemId,
        content_idea_id: suggestion.contentIdeaId,
        notes: suggestion.notes,
      })),
    },
  );
  if (error || !isContentOsUuid(String(data))) throw new ContentOsDataError();
  return String(data);
}

export async function reviewContentOsAiProposal(
  proposalId: string,
  decision: ContentOsPlanningDecision,
): Promise<void> {
  const adminUser = await requireWarhomeAdmin();
  if (
    !isContentOsUuid(proposalId) ||
    !isContentOsPlanningDecision(decision)
  ) {
    throw new ContentOsNotFoundError();
  }
  const { data, error } = await getSupabaseAdmin().rpc(
    "review_content_os_planning_proposal",
    {
      p_proposal_id: proposalId,
      p_admin_user_id: adminUser.userId,
      p_decision: decision,
    },
  );
  if (error || String(data) !== proposalId) throw new ContentOsDataError();
}
