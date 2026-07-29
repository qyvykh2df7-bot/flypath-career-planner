import { FlyPathApp } from "../../career-planner/page";
import { internalRouteRobots, requireInternalRoute } from "@/lib/security/internal-routes";

export const metadata = { robots: internalRouteRobots };

export default function ReviewSchoolsPage() {
  requireInternalRoute();
  return <FlyPathApp reviewMode initialTab="schools" />;
}
