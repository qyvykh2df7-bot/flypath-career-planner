"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createContentOsCalendarEvent,
  createContentOsIdea,
  createContentOsItem,
  deleteContentOsCalendarEvent,
  moveContentOsCalendarEvent,
  promoteContentOsIdea,
  updateContentOsCalendarEvent,
  updateContentOsIdea,
  updateContentOsItem,
  upsertContentOsMetric,
} from "@/lib/warhome/content-os";
import {
  isContentOsUuid,
  parseContentOsCalendarEventForm,
  parseContentOsIdeaForm,
  parseContentOsItemForm,
  parseContentOsMetricForm,
} from "@/lib/warhome/content-os-contract";

export type ContentOsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const CONTENT_OS_INITIAL_ACTION_STATE: ContentOsActionState = {
  status: "idle",
  message: null,
};

const INVALID_INPUT_MESSAGE = "Revisa los campos e inténtalo de nuevo.";
const SAVE_ERROR_MESSAGE = "No se ha podido guardar. Inténtalo de nuevo.";

function revalidateContentOs(contentItemId?: string): void {
  revalidatePath("/warhome/content");
  revalidatePath("/warhome/content/ideas");
  revalidatePath("/warhome/content/library");
  if (contentItemId) revalidatePath(`/warhome/content/library/${contentItemId}`);
}

export async function createContentOsIdeaAction(
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  const input = parseContentOsIdeaForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  try {
    await createContentOsIdea(input);
  } catch {
    console.error("[Warhome Content OS] Idea creation failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs();
  return { status: "success", message: "Idea guardada." };
}

export async function updateContentOsIdeaAction(
  ideaId: string,
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  if (!isContentOsUuid(ideaId)) return { status: "error", message: SAVE_ERROR_MESSAGE };
  const input = parseContentOsIdeaForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  try {
    await updateContentOsIdea(ideaId, input);
  } catch {
    console.error("[Warhome Content OS] Idea update failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs();
  return { status: "success", message: "Idea actualizada." };
}

export async function promoteContentOsIdeaAction(
  ideaId: string,
  formData: FormData,
): Promise<never> {
  void formData;
  if (!isContentOsUuid(ideaId)) redirect("/warhome/content/ideas?error=promote");

  let contentItemId: string;
  try {
    contentItemId = await promoteContentOsIdea(ideaId);
  } catch {
    console.error("[Warhome Content OS] Idea promotion failed");
    redirect("/warhome/content/ideas?error=promote");
  }

  revalidateContentOs(contentItemId);
  redirect(`/warhome/content/library/${contentItemId}`);
}

export async function createContentOsItemAction(
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  const input = parseContentOsItemForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  let contentItemId: string;
  try {
    contentItemId = await createContentOsItem(input);
  } catch {
    console.error("[Warhome Content OS] Content creation failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs(contentItemId);
  redirect(`/warhome/content/library/${contentItemId}`);
}

export async function updateContentOsItemAction(
  contentItemId: string,
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  if (!isContentOsUuid(contentItemId)) {
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }
  const input = parseContentOsItemForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  try {
    await updateContentOsItem(contentItemId, input);
  } catch {
    console.error("[Warhome Content OS] Content update failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs(contentItemId);
  return { status: "success", message: "Contenido actualizado." };
}

export async function createContentOsCalendarEventAction(
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  const input = parseContentOsCalendarEventForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  try {
    await createContentOsCalendarEvent(input);
  } catch {
    console.error("[Warhome Content OS] Calendar event creation failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs(input.contentItemId ?? undefined);
  return { status: "success", message: "Bloque añadido al calendario." };
}

export async function moveContentOsCalendarEventAction(
  eventId: string,
  startsAt: string,
  endsAt: string,
): Promise<ContentOsActionState> {
  if (!isContentOsUuid(eventId)) return { status: "error", message: SAVE_ERROR_MESSAGE };
  try {
    await moveContentOsCalendarEvent(eventId, startsAt, endsAt);
  } catch {
    console.error("[Warhome Content OS] Calendar event move failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs();
  return { status: "success", message: "Calendario actualizado." };
}

export async function updateContentOsCalendarEventAction(
  eventId: string,
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  if (!isContentOsUuid(eventId)) return { status: "error", message: SAVE_ERROR_MESSAGE };
  const input = parseContentOsCalendarEventForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  try {
    await updateContentOsCalendarEvent(eventId, input);
  } catch {
    console.error("[Warhome Content OS] Calendar event update failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs(input.contentItemId ?? undefined);
  return { status: "success", message: "Bloque actualizado." };
}

export async function deleteContentOsCalendarEventAction(
  eventId: string,
  formData: FormData,
): Promise<void> {
  void formData;
  if (!isContentOsUuid(eventId)) return;
  try {
    await deleteContentOsCalendarEvent(eventId);
  } catch {
    console.error("[Warhome Content OS] Calendar event deletion failed");
    return;
  }
  revalidateContentOs();
}

export async function upsertContentOsMetricAction(
  contentItemId: string,
  _previousState: ContentOsActionState,
  formData: FormData,
): Promise<ContentOsActionState> {
  if (!isContentOsUuid(contentItemId)) {
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }
  const input = parseContentOsMetricForm(formData);
  if (!input) return { status: "error", message: INVALID_INPUT_MESSAGE };

  try {
    await upsertContentOsMetric(contentItemId, input);
  } catch {
    console.error("[Warhome Content OS] Metric update failed");
    return { status: "error", message: SAVE_ERROR_MESSAGE };
  }

  revalidateContentOs(contentItemId);
  return { status: "success", message: "Métricas guardadas." };
}
