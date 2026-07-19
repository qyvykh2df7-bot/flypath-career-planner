import { getPublicSchoolReviewSummaries } from "@/lib/school-reviews/public";
import { SchoolReviewDataError } from "@/lib/school-reviews/service";

export const runtime = "nodejs";

const GENERIC_ERROR = { error: "No hemos podido cargar el resumen de opiniones." };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const schoolValues = (url.searchParams.get("schools") ?? "").split(",").filter(Boolean);
  if (!schoolValues.length) return Response.json({ items: [] });
  try {
    return Response.json({ items: await getPublicSchoolReviewSummaries(schoolValues) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof SchoolReviewDataError) return Response.json(GENERIC_ERROR, { status: 503 });
    return Response.json(GENERIC_ERROR, { status: 500 });
  }
}
