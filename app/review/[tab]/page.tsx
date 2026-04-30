import { notFound } from "next/navigation";
import { FlyPathApp, type Tab } from "../../page";

type ReviewPageProps = {
  params: Promise<{ tab: string }>;
};

const validTabs: Tab[] = ["route", "cost", "schools", "readiness", "report"];

export default async function ReviewTabPage({ params }: ReviewPageProps) {
  const { tab } = await params;
  if (!validTabs.includes(tab as Tab)) {
    notFound();
  }

  return <FlyPathApp reviewMode initialTab={tab as Tab} />;
}
