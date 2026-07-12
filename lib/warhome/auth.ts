import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WARHOME_ADMIN_ROLES = ["admin", "owner"] as const;

export type WarhomeAdminRole = (typeof WARHOME_ADMIN_ROLES)[number];

export type AuthenticatedWarhomeUser = {
  userId: string;
};

export type WarhomeAdmin = AuthenticatedWarhomeUser & {
  role: WarhomeAdminRole;
};

export type WarhomeAuthorizationResult =
  | { status: "unauthenticated" }
  | { status: "not_admin"; userId: string }
  | { status: "inactive"; userId: string; role: WarhomeAdminRole }
  | { status: "invalid_admin_record"; userId: string }
  | { status: "unavailable" }
  | { status: "authorized"; admin: WarhomeAdmin };

export class WarhomeAuthorizationError extends Error {
  readonly status: Exclude<WarhomeAuthorizationResult["status"], "authorized">;

  constructor(status: Exclude<WarhomeAuthorizationResult["status"], "authorized">) {
    super(`Warhome authorization failed: ${status}`);
    this.name = "WarhomeAuthorizationError";
    this.status = status;
  }
}

function isWarhomeAdminRole(value: unknown): value is WarhomeAdminRole {
  return typeof value === "string" && WARHOME_ADMIN_ROLES.includes(value as WarhomeAdminRole);
}

export async function getAuthenticatedWarhomeUser(): Promise<AuthenticatedWarhomeUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return { userId: user.id };
}

export async function getWarhomeAuthorization(): Promise<WarhomeAuthorizationResult> {
  const authenticatedUser = await getAuthenticatedWarhomeUser();
  if (!authenticatedUser) return { status: "unauthenticated" };

  const { data: adminUser, error } = await getSupabaseAdmin()
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", authenticatedUser.userId)
    .maybeSingle();

  if (error) return { status: "unavailable" };
  if (!adminUser) return { status: "not_admin", userId: authenticatedUser.userId };
  if (!isWarhomeAdminRole(adminUser.role) || typeof adminUser.is_active !== "boolean") {
    return { status: "invalid_admin_record", userId: authenticatedUser.userId };
  }
  if (!adminUser.is_active) {
    return { status: "inactive", userId: authenticatedUser.userId, role: adminUser.role };
  }

  return {
    status: "authorized",
    admin: {
      userId: authenticatedUser.userId,
      role: adminUser.role,
    },
  };
}

export async function requireWarhomeAdmin(): Promise<WarhomeAdmin> {
  const result = await getWarhomeAuthorization();
  if (result.status === "authorized") return result.admin;

  throw new WarhomeAuthorizationError(result.status);
}
