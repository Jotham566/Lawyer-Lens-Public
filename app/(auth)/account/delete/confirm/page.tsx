"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { confirmAccountDeletion } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";

type ConfirmState = "confirming" | "success" | "error" | "no-token";

function ConfirmDeletionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<ConfirmState>(token ? "confirming" : "no-token");
  const [error, setError] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      if (!token) return;

      try {
        const response = await confirmAccountDeletion(token);
        setState("success");
        // Format the scheduled date
        const date = new Date(response.scheduled_for);
        setScheduledFor(
          date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
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
      confirm();
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
            This deletion confirmation link is missing required information.
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

  // Confirming state (loading)
  if (state === "confirming") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Confirming Deletion
          </CardTitle>
          <CardDescription className="text-center">
            Please wait while we process your request...
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Deletion Scheduled
          </CardTitle>
          <CardDescription className="text-center">
            Your account is scheduled for permanent deletion.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Scheduled for:</strong> {scheduledFor}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
              You have 90 days to cancel this deletion if you change your mind. After this date, all your data will be permanently removed.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Changed your mind?</p>
            <p className="text-muted-foreground">
              Simply log in to your account to reactivate it. You can then cancel the scheduled deletion from your security settings.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Log in to reactivate account</Link>
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

  // Error state
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Confirmation Failed
        </CardTitle>
        <CardDescription className="text-center">
          {error || "This deletion link is invalid or has expired."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">What to do next:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Check if the link was copied correctly</li>
            <li>Log in to request a new deletion link</li>
            <li>Contact support if the issue persists</li>
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

export default function ConfirmDeletionPage() {
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
      <ConfirmDeletionContent />
    </Suspense>
  );
}
