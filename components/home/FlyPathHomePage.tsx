import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeResourcesShowcase } from "@/components/home/HomeResourcesShowcase";
import { HomeSchoolsTrustSection } from "@/components/home/HomeSchoolsTrustSection";
import { HomeBlogNewsletterSection } from "@/components/home/HomeBlogNewsletterSection";
import { HomeFooter } from "@/components/home/HomeFooter";
import type { BlogPostMeta } from "@/lib/blog-types";

export function FlyPathHomePage({ latestPost }: { latestPost: BlogPostMeta | null }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#071224]">
      <FlyPathPlatformHeader pageTitle="Inicio" currentModuleId="inicio" logoMode="landing" />

      <main className="flex flex-col">
        <HomeHero />
        <HomeResourcesShowcase />
        <HomeSchoolsTrustSection />
        <HomeBlogNewsletterSection latestPost={latestPost} />
      </main>

      <HomeFooter />
    </div>
  );
}
