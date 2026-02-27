import Link from "next/link";
import { Mail, LifeBuoy, Briefcase, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

interface ContactPageProps {
  searchParams?: Promise<{ subject?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const subject = resolvedSearchParams.subject || "General Inquiry";
  const salesMailto = `mailto:sales@lawlens.io?subject=${encodeURIComponent(subject)}`;
  const supportMailto = "mailto:support@lawlens.io?subject=Support Request";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs className="mb-6" />

      <div className="mb-6">
        <Link href="/help" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Help
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">
          Reach the right team for support, sales, or enterprise onboarding.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Billing issues, account access, and technical troubleshooting.
            </p>
            <Button asChild className="w-full">
              <a href={supportMailto}>
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enterprise plans, procurement, and custom deployment discussions.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href={salesMailto}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Sales
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
