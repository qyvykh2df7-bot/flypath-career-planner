import { ReportPreviewDocument } from "@/components/report-preview/ReportPreviewDocument";
import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";
import { internalRouteRobots, requireInternalRoute } from "@/lib/security/internal-routes";

export const metadata = {
  title: "FlyPath Career Report · Preview",
  description: "Vista previa premium del informe FlyPath Career Planner",
  robots: internalRouteRobots,
};

export default function ReportPreviewPage() {
  requireInternalRoute();
  const snapshot = createDemoReportSnapshot();

  return <ReportPreviewDocument snapshot={snapshot} />;
}
