"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import confetti from "canvas-confetti";
import { useAuth, useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

function SuccessContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "professional";

  useEffect(() => {
    // Celebration confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#22c55e", "#3b82f6", "#8b5cf6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#22c55e", "#3b82f6", "#8b5cf6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const tierNames: Record<string, string> = {
    professional: "Professional",
    team: "Team",
    enterprise: "Enterprise",
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoading message="Redirecting to login..." />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome aboard!</CardTitle>
          <CardDescription>
            Your subscription to the {tierNames[tier] || tier} plan is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h3 className="font-medium">What&apos;s next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Access all premium features immediately</li>
              <li>• Your usage limits have been upgraded</li>
              <li>• Check your email for a receipt</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/settings/billing")}
              className="w-full"
            >
              View Billing Settings
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:support@lawlens.io" className="underline">
              support@lawlens.io
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
