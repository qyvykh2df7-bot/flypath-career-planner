import { getPublicSupabaseSchoolCatalog } from "@/lib/schools/public-school-catalog";

export const runtime = "nodejs";

const UNAVAILABLE_MESSAGE = "No hemos podido cargar el catálogo de escuelas.";

export async function GET() {
  try {
    const schools = await getPublicSupabaseSchoolCatalog();
    return Response.json({ schools }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return Response.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
  }
}
