"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

/**
 * Root page — routing hub.
 *
 * Authenticated users → /chat (dashboard)
 * Unauthenticated users → /landing (marketing page)
 */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/chat");
    } else {
      router.replace("/landing");
    }
  }, [isLoading, isAuthenticated, router]);

  // Brief loading state while auth resolves
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
