"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchSession } from "@/lib/api/auth";
import { PageLoader } from "@/components/ui/page-loader";

// Client-side replacement for the old proxy.ts middleware: gates the dashboard
// behind a Supabase session and bounces to /login when signed out. Required
// because static export (Capacitor) has no server to run middleware.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return watchSession((session) => {
      setReady(!!session);
      if (!session) router.replace("/login");
    });
  }, [router]);

  if (!ready) {
    return <PageLoader />;
  }
  return <>{children}</>;
}
