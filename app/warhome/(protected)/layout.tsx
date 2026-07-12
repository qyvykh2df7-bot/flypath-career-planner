import { redirect } from "next/navigation";
import { getWarhomeAccessDecision, WARHOME_LOGIN_PATH } from "@/lib/warhome/access";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";

export default async function WarhomeProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const decision = getWarhomeAccessDecision(await getWarhomeAuthorization());
  if (decision.type === "redirect_to_login") redirect(WARHOME_LOGIN_PATH);

  return children;
}
