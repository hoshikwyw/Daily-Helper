"use client";

import dynamic from "next/dynamic";
import { AuthGuard } from "@/components/auth-guard";

const DashboardShell = dynamic(
  () => import("@/components/dashboard/shell").then((m) => ({ default: m.DashboardShell })),
  { ssr: false, loading: () => <div className="min-h-screen animate-pulse bg-white/5" /> }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
