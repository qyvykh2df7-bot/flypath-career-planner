import { FreeReportPreviewDocument } from "@/components/free-report-preview/FreeReportPreviewDocument";
import { mapSnapshotToFreeReportData } from "@/lib/free-report-data";
import { createDemoReportSnapshot } from "@/lib/reporting/mocks/demo-report-snapshot";

export const metadata = {
  title: "FlyPath · Informe gratuito · Preview",
  description: "Vista previa del resumen ejecutivo gratuito FlyPath Career Planner",
};

export default function FreeReportPreviewPage() {
  const data = mapSnapshotToFreeReportData(createDemoReportSnapshot());

  return <FreeReportPreviewDocument data={data} />;
}
