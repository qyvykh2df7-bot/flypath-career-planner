import { ReviewEmailVerification } from "@/components/opiniones/ReviewEmailVerification";

export const metadata = { title: "Verificar opinión | FlyPath", robots: { index: false, follow: false } };

export default async function ReviewVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const query = await searchParams;
  return <ReviewEmailVerification token={typeof query.token === "string" ? query.token : null} />;
}
