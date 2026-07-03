import { redirect } from "next/navigation";

/** Compatibilidad: la pantalla intermedia se eliminó; el planner es el destino principal. */
export default function PlanificaTuRutaPage() {
  redirect("/career-planner");
}
