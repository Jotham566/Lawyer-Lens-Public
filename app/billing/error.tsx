"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { CreditCard, RefreshCw, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "billing" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-center min-h-[60vh] p-6"
    >
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <CreditCard
                className="h-8 w-8 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Billing Error</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We encountered an issue loading your billing information. Your
              subscription and payment data are safe.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 p-3 bg-muted rounded text-xs text-left overflow-auto max-w-full">
                {error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={reset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  Go Home
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Get Help
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              If this issue persists, please contact our support team.
              {error.digest && (
                <span className="block mt-1 font-mono text-muted-foreground/60">
                  Error ID: {error.digest}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
