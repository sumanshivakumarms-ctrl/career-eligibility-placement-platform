import Landing from "@/components/Landing";
import { getFeaturedCompanies, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, companies] = await Promise.all([getStats(), getFeaturedCompanies()]);
  return <Landing stats={stats} companies={companies} />;
}
