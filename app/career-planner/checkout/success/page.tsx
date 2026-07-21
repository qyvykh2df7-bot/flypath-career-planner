import { CareerPlannerCheckoutConfirmationModal } from "@/components/career-planner/CareerPlannerCheckoutConfirmationModal";

export const metadata = {
  title: "Pago en verificación | FlyPath",
  robots: { index: false, follow: false },
};

export default async function CareerPlannerCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;
  return <CareerPlannerCheckoutConfirmationModal sessionId={sessionId} />;
}
