import { ParentsReportPreviewDocument } from "@/components/parents-report-preview/ParentsReportPreviewDocument";
import { internalRouteRobots, requireInternalRoute } from "@/lib/security/internal-routes";

export const metadata = {
  title: "FlyPath · Informe para padres · Preview",
  description: "Vista previa del informe FlyPath para familias de futuros pilotos",
  robots: internalRouteRobots,
};

export default function ParentsReportPreviewPage() {
  requireInternalRoute();
  return <ParentsReportPreviewDocument />;
}
