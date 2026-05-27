import { ReportPreviewDocument } from "@/components/report-preview/ReportPreviewDocument";
import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";

export const metadata = {
  title: "FlyPath Career Report · Preview",
  description: "Vista previa premium del informe FlyPath Career Planner",
};

export default function ReportPreviewPage() {
  const snapshot = createDemoReportSnapshot();

  return <ReportPreviewDocument snapshot={snapshot} />;
}
