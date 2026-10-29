"use client";

import dynamic from "next/dynamic";
import { AuthGuard } from "@/components/auth-guard";
import { RecurrenceSyncProvider } from "@/components/recurrence-sync";
import { PageLoader } from "@/components/ui/page-loader";

const DashboardShell = dynamic(
  () => import("@/components/dashboard/shell").then((m) => ({ default: m.DashboardShell })),
  { ssr: false, loading: () => <PageLoader /> }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Creates any recurring entries and tasks that fell due; needs a session. */}
      <RecurrenceSyncProvider>
        <DashboardShell>{children}</DashboardShell>
      </RecurrenceSyncProvider>
    </AuthGuard>
  );
}
