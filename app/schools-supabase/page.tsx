import { redirect } from "next/navigation";

/**
 * La antigua superficie de depuración serializaba perfiles editoriales completos.
 * El catálogo público vive ahora en /schools a través de un DTO cerrado.
 */
export default function SchoolsSupabasePage() {
  redirect("/schools");
}
