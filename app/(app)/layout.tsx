import { AppSidebar } from "@ui/components/app-sidebar";
import { AppFooter } from "@ui/components/app-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
