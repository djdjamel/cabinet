import { redirect } from "next/navigation";
import { getSession } from "@infrastructure/auth/session";
import { SettingsView } from "@ui/settings/settings-view";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  return <SettingsView />;
}

export const dynamic = "force-dynamic";
