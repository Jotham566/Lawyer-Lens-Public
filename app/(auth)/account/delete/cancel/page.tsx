"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cancelAccountDeletion } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";

type CancelState = "cancelling" | "success" | "error" | "no-token";

function CancelDeletionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<CancelState>(token ? "cancelling" : "no-token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cancel() {
      if (!token) return;

      try {
        await cancelAccountDeletion(token);
        setState("success");
      } catch (err) {
        setState("error");
        if (err instanceof APIError) {
          setError(err.message || "Invalid or expired token");
        } else {
          setError("An unexpected error occurred");
        }
      }
    }

    if (token) {
      cancel();
    }
  }, [token]);

  // No token provided
  if (state === "no-token") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Invalid Link</CardTitle>
          <CardDescription className="text-center">
            This cancellation link is missing required information.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Cancelling state (loading)
  if (state === "cancelling") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Cancelling Deletion
          </CardTitle>
          <CardDescription className="text-center">
            Please wait while we reactivate your account...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Account Reactivated
          </CardTitle>
          <CardDescription className="text-center">
            Your account deletion has been cancelled and your account is now active again.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-200">
            <p>
              Welcome back! You can now log in and continue using Law Lens as usual.
              All your data has been preserved.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Log in to your account</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Error state
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Cancellation Failed
        </CardTitle>
        <CardDescription className="text-center">
          {error || "This cancellation link is invalid or has expired."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">What to do next:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Check if the link was copied correctly</li>
            <li>If you confirmed deletion, log in to cancel it</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button asChild className="w-full">
          <Link href="/login">Go to Login</Link>
        </Button>
        <Link
          href="/"
          className="text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Go to homepage
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function CancelDeletionPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Loading</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <CancelDeletionContent />
    </Suspense>
  );
}
