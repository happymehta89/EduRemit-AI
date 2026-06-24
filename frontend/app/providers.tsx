"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { initAnalytics } from "@/lib/analytics";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
