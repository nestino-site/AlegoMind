import { ProfessionalProfileClient } from "./ProfessionalProfileClient";

// Next.js 15: route `params` are a Promise. This page stays a thin async
// Server Component just to unwrap it — all UI/data-fetching lives in the
// Client Component below (this app's React version predates the `use()`
// hook, so `await` in a Server Component is the simplest correct way).
export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfessionalProfileClient id={id} />;
}
