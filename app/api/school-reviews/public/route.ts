import { getPublicSchoolReviewPage } from "@/lib/school-reviews/public";
import { SchoolReviewDataError } from "@/lib/school-reviews/service";

export const runtime = "nodejs";

const GENERIC_ERROR = { error: "No hemos podido cargar las opiniones." };

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const page = await getPublicSchoolReviewPage(url.searchParams.get("school"), url.searchParams.get("page"));
    if (!page) return Response.json(GENERIC_ERROR, { status: 404 });
    return Response.json(page, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof SchoolReviewDataError) return Response.json(GENERIC_ERROR, { status: 503 });
    return Response.json(GENERIC_ERROR, { status: 500 });
  }
}
