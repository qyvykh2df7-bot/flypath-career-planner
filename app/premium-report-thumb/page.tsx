import { PremiumReportPreviewCapture } from "@/components/career-planner/PremiumReportPreviewCapture";
import { internalRouteRobots, requireInternalRoute } from "@/lib/security/internal-routes";

export const metadata = { robots: internalRouteRobots };

/** Ruta interna para generar /public/premium-report-preview.png (captura estática). */
export default function PremiumReportThumbPage() {
  requireInternalRoute();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8eaef] p-8">
      <PremiumReportPreviewCapture />
    </div>
  );
}
