import { CircleGauge } from "lucide-react";
import { notFound } from "next/navigation";
import { WarhomeUserDetail } from "@/components/warhome/WarhomeUserDetail";
import {
  getWarhomeUserDetail,
  WarhomeUserNotFoundError,
  type WarhomeUserDetail as WarhomeUserDetailData,
} from "@/lib/warhome/user-detail";

type WarhomeUserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function WarhomeUserDetailPage({ params }: WarhomeUserDetailPageProps) {
  const { userId } = await params;
  let detail: WarhomeUserDetailData | null = null;
  let userNotFound = false;

  try {
    detail = await getWarhomeUserDetail(userId);
  } catch (error) {
    userNotFound = error instanceof WarhomeUserNotFoundError;
  }

  if (userNotFound) notFound();

  if (!detail) {
    return (
      <div className="mx-auto max-w-[1440px]">
        <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center">
          <CircleGauge className="h-7 w-7 text-[#d6ae4f]" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-white">No se ha podido cargar la ficha</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.</p>
        </section>
      </div>
    );
  }

  return <WarhomeUserDetail detail={detail} />;
}
