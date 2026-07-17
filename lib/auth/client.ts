import "client-only";

import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toFlyPathAccount, type FlyPathClientAuthState, type FlyPathSessionState } from "./types";

export type FlyPathAuthStateListener = (state: FlyPathClientAuthState) => void;

function toFlyPathClientSessionState(session: Session | null): FlyPathSessionState {
  if (!session) return { status: "anonymous" };
  return { status: "authenticated", account: toFlyPathAccount(session.user) };
}

export function initializeFlyPathAuthState(listener: FlyPathAuthStateListener): () => void {
  let isActive = true;
  let receivedAuthEvent = false;
  const emit = (state: FlyPathClientAuthState) => {
    if (isActive) listener(state);
  };

  emit({ status: "loading" });

  const {
    data: { subscription },
  } = createSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
    receivedAuthEvent = true;
    emit(toFlyPathClientSessionState(session));
  });

  void createSupabaseBrowserClient()
    .auth.getSession()
    .then(({ data: { session }, error }) => {
      if (receivedAuthEvent) return;
      emit(error ? { status: "unavailable" } : toFlyPathClientSessionState(session));
    })
    .catch(() => {
      if (!receivedAuthEvent) emit({ status: "unavailable" });
    });

  return () => {
    isActive = false;
    subscription.unsubscribe();
  };
}

export async function signOutFlyPath(): Promise<boolean> {
  try {
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    return !error;
  } catch {
    return false;
  }
}
