"use client";

import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lock, Mail, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

interface BetaGuardProps {
  children: ReactNode;
  email?: string;
}

export function BetaGuard({ children, email }: BetaGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!email) {
      // No email provided, assume no access
      setHasAccess(false);
      setChecking(false);
      return;
    }

    // Check beta access for the provided email
    checkBetaAccess(email);
  }, [email]);

  const checkBetaAccess = async (emailToCheck: string) => {
    try {
      const response = await fetch(`/api/v1/beta/waitlist/status?email=${encodeURIComponent(emailToCheck)}`);

      if (response.ok) {
        const data = await response.json();
        // User is on waitlist - check if invited
        setHasAccess(data.status === "invited" || data.invited === true);
      } else {
        // Not on waitlist, no access
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking beta access:", error);
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <BetaAccessRequired />;
  }

  return <>{children}</>;
}

function BetaAccessRequired() {
  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <Card className="max-w-lg w-full border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <Badge className="mx-auto mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            Beta Access Required
          </Badge>
          <CardTitle className="text-2xl">Registration is Invite-Only</CardTitle>
          <CardDescription className="text-base">
            Legal Intelligence is currently in private beta. Join our waitlist to get early access!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Beta users receive:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Early Adopter Badge</li>
                <li>• 180-day extended trial</li>
                <li>• Priority support</li>
                <li>• Founding member pricing</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/#waitlist">
                <Mail className="mr-2 h-4 w-4" />
                Join Waitlist
              </Link>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an invitation?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-3">What happens next?</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-base">📧</span>
                <span>We're inviting users weekly in order of signup</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-base">⚡</span>
                <span>You'll receive an invitation email with registration link</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-base">🎯</span>
                <span>Check your email for your unique invitation code</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
