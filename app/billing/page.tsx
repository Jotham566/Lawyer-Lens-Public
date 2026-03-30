"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /billing → redirects to /settings/billing
 * Kept for backwards compatibility with existing links/bookmarks.
 */
export default function BillingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/billing");
  }, [router]);

  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
