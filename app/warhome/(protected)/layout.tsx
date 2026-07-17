import { redirect } from "next/navigation";
import { WarhomeShell } from "@/components/warhome/WarhomeShell";
import {
  getWarhomeAccessDecision,
  WARHOME_LOGIN_PATH,
  WARHOME_PUBLIC_EXIT_PATH,
} from "@/lib/warhome/access";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";

export default async function WarhomeProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authorization = await getWarhomeAuthorization();
  const decision = getWarhomeAccessDecision(authorization);
  if (decision.type === "redirect_to_login") redirect(WARHOME_LOGIN_PATH);
  if (decision.type === "redirect_to_public_home") redirect(WARHOME_PUBLIC_EXIT_PATH);

  if (authorization.status !== "authorized") redirect(WARHOME_LOGIN_PATH);

  return <WarhomeShell role={authorization.admin.role}>{children}</WarhomeShell>;
}
