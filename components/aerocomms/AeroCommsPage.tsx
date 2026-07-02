import { FlyPathPlatformHeader } from "@/components/FlyPathPlatformHeader";
import { AeroCommsHero } from "@/components/aerocomms/AeroCommsHero";
import { AeroCommsValue } from "@/components/aerocomms/AeroCommsValue";
import { AeroCommsTrainingShowcase } from "@/components/aerocomms/AeroCommsTrainingShowcase";
import { AeroCommsBeta } from "@/components/aerocomms/AeroCommsBeta";
import { AeroCommsPricing } from "@/components/aerocomms/AeroCommsPricing";
import { AeroCommsFaq } from "@/components/aerocomms/AeroCommsFaq";
import { HomeFooter } from "@/components/home/HomeFooter";

export function AeroCommsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#071224]">
      <FlyPathPlatformHeader pageTitle="AeroComms" currentModuleId="aerocomms" />
      <main className="flex flex-col">
        <AeroCommsHero />
        <AeroCommsValue />
        <AeroCommsTrainingShowcase />
        <AeroCommsBeta />
        <AeroCommsPricing />
        <AeroCommsFaq />
      </main>
      <HomeFooter />
    </div>
  );
}
