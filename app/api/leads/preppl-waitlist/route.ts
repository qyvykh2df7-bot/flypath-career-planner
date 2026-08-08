export const runtime = "nodejs";

/**
 * Pre-PPL is now sold directly. Keep the former route closed so legacy clients
 * cannot create new waitlist leads, while historical CRM data stays untouched.
 */
export async function POST() {
  return Response.json({ error: "La lista de espera de Pre-PPL ya no está disponible." }, { status: 410 });
}
