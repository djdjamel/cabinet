import { redirect } from "next/navigation";
import { getSession } from "@infrastructure/auth/session";
import { MetricsPanel } from "@ui/dashboard/metrics-panel";

export default async function MetricsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-display font-bold text-on-surface mb-1">Métriques du jour</h1>
        <p className="text-sm text-on-surface-variant mb-8">Statistiques en temps réel de votre cabinet</p>
        <MetricsPanel />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
