"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useRequireAuth } from "@/components/providers";
import { getCurrentOrganization, type Organization } from "@/lib/api/organizations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { isLoading: authLoading } = useRequireAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  useEffect(() => {
    async function loadOrganization() {
      if (!isAuthenticated) {
        setLoadingOrg(false);
        return;
      }

      try {
        const org = await getCurrentOrganization();
        setOrganization(org);
      } catch {
        setOrganization(null);
      } finally {
        setLoadingOrg(false);
      }
    }

    loadOrganization();
  }, [isAuthenticated]);

  if (authLoading || loadingOrg) {
    return (
      <div className="container max-w-5xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Loading admin console...</CardTitle>
            <CardDescription>Please wait while we verify access.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isAdmin =
    organization?.current_user_role === "admin" ||
    organization?.current_user_role === "owner";

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need admin or owner access to use this area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
