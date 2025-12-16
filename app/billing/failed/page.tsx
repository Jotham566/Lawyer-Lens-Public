"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Your payment could not be processed";

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h3 className="font-medium">What might have happened?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Insufficient funds in your account</li>
              <li>• Payment was declined by your bank</li>
              <li>• Transaction timed out</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.back()}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/pricing")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:support@legalintelligence.com" className="underline">
              support@legalintelligence.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <FailedContent />
    </Suspense>
  );
}
