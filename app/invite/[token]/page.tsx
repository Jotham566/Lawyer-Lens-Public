"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers";
import {
  getInvitationByToken,
  acceptInvitation,
  type OrganizationInvitation,
} from "@/lib/api/organizations";
import { APIError } from "@/lib/api/client";
import { formatDateOnly } from "@/lib/utils/date-formatter";

export default function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Auto-redirect to dashboard after accepting
  useEffect(() => {
    if (!accepted) return;

    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [accepted, router]);

  // Load invitation details
  useEffect(() => {
    async function loadInvitation() {
      try {
        const inv = await getInvitationByToken(token);
        setInvitation(inv);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message || "Invalid or expired invitation");
        } else {
          setError("Failed to load invitation");
        }
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) return;

    setAccepting(true);
    setError(null);

    try {
      await acceptInvitation(token);
      setAccepted(true);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Failed to accept invitation");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Welcome to the team!</CardTitle>
            <CardDescription>
              You&apos;ve successfully joined <strong>{invitation?.organization_name}</strong>.
              Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join an organization on Law Lens
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited to</span>
              <span className="font-medium">
                {invitation?.organization_name || "Organization"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary" className="capitalize">
                {invitation?.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited by</span>
              <span className="text-sm">{invitation?.invited_by_email || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {invitation?.expires_at && formatDateOnly(invitation.expires_at)}
              </span>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Please sign in or create an account to accept this invitation
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline">
                  <Link href={`/login?returnUrl=${encodeURIComponent(`/invite/${token}`)}`}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/register?returnUrl=${encodeURIComponent(`/invite/${token}`)}`}>
                    Create Account
                  </Link>
                </Button>
              </div>
            </div>
          ) : invitation?.email.toLowerCase() !== user?.email?.toLowerCase() ? (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Email mismatch
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    This invitation was sent to{" "}
                    <span className="font-medium">{invitation?.email}</span> but you&apos;re
                    signed in as <span className="font-medium">{user?.email}</span>.
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Please sign in with the correct account.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {isAuthenticated &&
            invitation?.email.toLowerCase() === user?.email?.toLowerCase() && (
              <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            )}
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/">Cancel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
