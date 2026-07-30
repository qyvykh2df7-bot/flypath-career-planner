"use server";

import { revalidatePath } from "next/cache";
import { isContentOsUuid } from "@/lib/warhome/content-os-contract";
import {
  disconnectContentOsTikTokAccount,
  importContentOsTikTokUrl,
  reviewContentOsTikTokVideo,
  syncContentOsTikTok,
} from "@/lib/warhome/content-os-tiktok";
import {
  parseContentOsTikTokManualImportForm,
  parseContentOsTikTokReviewForm,
} from "@/lib/warhome/content-os-tiktok-contract";

const INTEGRATION_PATH = "/warhome/content/integrations/tiktok";

type ContentOsTikTokActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function revalidateTikTok(): void {
  revalidatePath(INTEGRATION_PATH);
  revalidatePath("/warhome/content/library");
  revalidatePath("/warhome/content/strategist");
}

export async function syncContentOsTikTokAction(
  _previousState: ContentOsTikTokActionState,
  _formData: FormData,
): Promise<ContentOsTikTokActionState> {
  void _previousState;
  void _formData;
  try {
    const result = await syncContentOsTikTok();
    revalidateTikTok();
    if (result.analysisFailed) {
      return {
        status: "error",
        message: `${result.imported} vídeos sincronizados; ${result.analysisFailed} análisis quedan pendientes de reintento.`,
      };
    }
    return {
      status: "success",
      message: `${result.imported} vídeos sincronizados y ${result.analyzed} análisis preparados.`,
    };
  } catch {
    console.error("[Warhome Content OS] TikTok sync failed");
    return {
      status: "error",
      message: "No se ha podido sincronizar TikTok. Inténtalo de nuevo.",
    };
  }
}

export async function disconnectContentOsTikTokAction(
  _previousState: ContentOsTikTokActionState,
  _formData: FormData,
): Promise<ContentOsTikTokActionState> {
  void _previousState;
  void _formData;
  try {
    await disconnectContentOsTikTokAccount();
    revalidateTikTok();
    return {
      status: "success",
      message: "Cuenta TikTok desconectada. El histórico confirmado se conserva.",
    };
  } catch {
    console.error("[Warhome Content OS] TikTok disconnect failed");
    return {
      status: "error",
      message: "No se ha podido desconectar TikTok.",
    };
  }
}

export async function importContentOsTikTokUrlAction(
  _previousState: ContentOsTikTokActionState,
  formData: FormData,
): Promise<ContentOsTikTokActionState> {
  const input = parseContentOsTikTokManualImportForm(formData);
  if (!input) {
    return {
      status: "error",
      message: "Revisa la URL, la fecha y las métricas.",
    };
  }
  try {
    const result = await importContentOsTikTokUrl(input);
    revalidateTikTok();
    return result.analysisFailed
      ? {
          status: "error",
          message:
            "Vídeo importado. El análisis no está disponible y se reintentará más adelante.",
        }
      : {
          status: "success",
          message: "Vídeo importado y preparado para revisión.",
        };
  } catch {
    console.error("[Warhome Content OS] TikTok manual import failed");
    return {
      status: "error",
      message: "No se ha podido importar el vídeo.",
    };
  }
}

export async function reviewContentOsTikTokVideoAction(
  videoId: string,
  decision: string,
  _previousState: ContentOsTikTokActionState,
  formData: FormData,
): Promise<ContentOsTikTokActionState> {
  const input = parseContentOsTikTokReviewForm(formData);
  if (
    !isContentOsUuid(videoId) ||
    (decision !== "confirmed" && decision !== "rejected") ||
    !input
  ) {
    return { status: "error", message: "Revisa los campos del análisis." };
  }
  try {
    await reviewContentOsTikTokVideo(videoId, decision, input);
    revalidateTikTok();
    return {
      status: "success",
      message:
        decision === "confirmed"
          ? "Análisis confirmado y añadido a la biblioteca."
          : "Análisis rechazado.",
    };
  } catch {
    console.error("[Warhome Content OS] TikTok review failed");
    return { status: "error", message: "No se ha podido guardar la revisión." };
  }
}
