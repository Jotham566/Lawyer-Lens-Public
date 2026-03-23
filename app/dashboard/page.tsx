"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

/**
 * Dashboard redirect — authenticated users land on Ask Ben (chat).
 * Unauthenticated users go to the landing page.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? "/chat" : "/");
    }
  }, [isLoading, isAuthenticated, router]);

  return <PageLoading />;
}
