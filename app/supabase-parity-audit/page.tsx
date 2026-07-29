import { redirect } from "next/navigation";
import { internalRouteRobots, requireInternalRoute } from "@/lib/security/internal-routes";

export const metadata = { robots: internalRouteRobots };

export default function SupabaseParityAuditPage() {
  requireInternalRoute();
  redirect("/schools");
}
