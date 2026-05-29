import type { Metadata } from "next";
import { FlyPathHomePage } from "@/components/home/FlyPathHomePage";

export const metadata: Metadata = {
  title: "FlyPath — Tu copiloto durante toda la formación",
  description:
    "Planifica tu ruta, compara escuelas y evita errores caros antes de comprometer dinero en tu formación de piloto.",
};

export default function HomePage() {
  return <FlyPathHomePage />;
}
