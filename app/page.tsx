import type { Metadata } from "next";
import { FlyPathHomePage } from "@/components/home/FlyPathHomePage";
import { getAllPosts } from "@/lib/blog";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "FlyPath — Tu copiloto durante toda la formación",
  description:
    "Tu copiloto desde el primer día hasta tu primera entrevista en aerolínea. Planifica tu ruta y evita errores caros antes de pagar.",
  path: "/",
  imagePath: "/herohome.webp",
  imageAlt: "FlyPath, tu copiloto durante toda la formación",
});

export default function HomePage() {
  const [latestPost = null] = getAllPosts();
  return <FlyPathHomePage latestPost={latestPost} />;
}
