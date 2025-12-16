"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Smartphone, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 30; // 5 minutes at 10 second intervals

  useEffect(() => {
    if (!reference) return;

    const checkStatus = async () => {
      try {
        setChecking(true);
        const response = await fetch(`/api/billing/payment-status?reference=${reference}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "successful") {
            router.push(`/billing/success?tier=${data.tier}`);
            return true;
          } else if (data.status === "failed") {
            router.push(`/billing/failed?reason=${encodeURIComponent(data.reason || "Payment failed")}`);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Failed to check status:", error);
        return false;
      } finally {
        setChecking(false);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 10 seconds
    const interval = setInterval(async () => {
      setAttempts((prev) => {
        const newAttempts = prev + 1;
        setProgress((newAttempts / maxAttempts) * 100);
        return newAttempts;
      });

      const complete = await checkStatus();
      if (complete || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [reference, router, attempts]);

  const handleManualCheck = async () => {
    if (!reference || checking) return;

    setChecking(true);
    try {
      const response = await fetch(`/api/billing/payment-status?reference=${reference}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "successful") {
          router.push(`/billing/success?tier=${data.tier}`);
        } else if (data.status === "failed") {
          router.push(`/billing/failed?reason=${encodeURIComponent(data.reason || "Payment failed")}`);
        }
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Payment Pending</CardTitle>
          <CardDescription>
            Please complete the payment on your phone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Check your phone</p>
                <p className="text-muted-foreground">
                  You should receive a prompt to enter your Mobile Money PIN.
                  Please complete the transaction on your phone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Checking payment status...</span>
              {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              This page will automatically update when payment is confirmed
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Payment Status
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/pricing")}
              className="w-full"
            >
              Cancel and go back
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Having trouble?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Make sure you have sufficient balance</li>
              <li>• Check if you received the payment prompt</li>
              <li>• Try initiating the payment again</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
