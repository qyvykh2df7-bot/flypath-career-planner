import { PremiumReportPreviewCapture } from "@/components/career-planner/PremiumReportPreviewCapture";

/** Ruta interna para generar /public/premium-report-preview.png (captura estática). */
export default function PremiumReportThumbPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8eaef] p-8">
      <PremiumReportPreviewCapture />
    </div>
  );
}
