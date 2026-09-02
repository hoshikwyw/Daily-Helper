"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageBackdrop } from "@/components/ui/page-loader";

// Client-side redirect (static export has no server to run next/navigation's
// redirect()). The dashboard's AuthGuard then routes to /login if needed.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <PageBackdrop />;
}
