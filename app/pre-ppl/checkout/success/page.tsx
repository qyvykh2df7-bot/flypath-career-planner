import { PrePplCheckoutConfirmationModal } from "@/components/pre-ppl/PrePplCheckoutConfirmationModal";

export const metadata = { title: "Pago en verificación | FlyPath", robots: { index: false, follow: false } };

export default async function PrePplCheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const params = await searchParams;
  return <PrePplCheckoutConfirmationModal sessionId={typeof params.session_id === "string" ? params.session_id : null} />;
}
