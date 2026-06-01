import { redirect } from "next/navigation";
import { getSession } from "@infrastructure/auth/session";
import { DashboardView } from "@ui/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return <DashboardView />;
}

export const dynamic = "force-dynamic";
