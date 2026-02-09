"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsageDashboard } from "@/components/billing/usage-dashboard";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

export default function UsagePage() {
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();

  if (authLoading) {
    return <PageLoading message="Loading usage..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings/billing")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Usage Details</h2>
          <p className="text-sm text-muted-foreground">
            Track your usage across all features
          </p>
        </div>
      </div>

      <UsageDashboard showHeader={true} compact={false} />
    </div>
  );
}
