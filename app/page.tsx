import type { Metadata } from "next";
import { FlyPathHomePage } from "@/components/home/FlyPathHomePage";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "FlyPath — Tu copiloto durante toda la formación",
  description:
    "Tu copiloto desde el primer día hasta tu primera entrevista en aerolínea. Planifica tu ruta y evita errores caros antes de pagar.",
};

export default function HomePage() {
  const [latestPost = null] = getAllPosts();
  return <FlyPathHomePage latestPost={latestPost} />;
}
