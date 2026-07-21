import { GuideCheckoutConfirmationModal } from "@/components/guia/GuideCheckoutConfirmationModal";

export const metadata = { title: "Pago en verificación | FlyPath", robots: { index: false, follow: false } };

export default async function GuideCheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const params = await searchParams;
  return <GuideCheckoutConfirmationModal sessionId={typeof params.session_id === "string" ? params.session_id : null} />;
}
