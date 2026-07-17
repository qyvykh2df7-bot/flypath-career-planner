import type { User } from "@supabase/supabase-js";

export type FlyPathAccount = {
  id: string;
  email: string | null;
};

export type FlyPathSessionState =
  | { status: "authenticated"; account: FlyPathAccount }
  | { status: "anonymous" }
  | { status: "unavailable" };

export type FlyPathClientAuthState = FlyPathSessionState | { status: "loading" };

export function toFlyPathAccount(
  user: Pick<User, "id" | "email" | "email_confirmed_at">,
): FlyPathAccount {
  return {
    id: user.id,
    email: user.email_confirmed_at ? user.email ?? null : null,
  };
}
