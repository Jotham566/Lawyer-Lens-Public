import { Shield, Eye, Lock, Server, UserCheck, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section className="mb-10">
        <p className="text-muted-foreground leading-relaxed">
          Law Lens (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your
          information when you use our legal research platform.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                When you create an account, we collect your name, email address,
                and organization details to provide our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-primary" />
                Usage Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We collect information about how you use our platform, including
                search queries and documents viewed, to improve our services.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How We Use Your Information */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>To provide and maintain our legal research services</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>To improve and personalize your experience on our platform</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>To communicate with you about your account and our services</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>To ensure the security and integrity of our platform</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>To comply with legal obligations</span>
          </li>
        </ul>
      </section>

      {/* Data Security */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Data Security</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-5 w-5 text-primary" />
                Encryption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All data is encrypted in transit using TLS and at rest using
                industry-standard encryption algorithms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5 text-primary" />
                Secure Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our platform is hosted on secure cloud infrastructure with
                regular security audits and monitoring.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Your Rights */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          You have the right to:
        </p>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Access the personal information we hold about you</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Request correction of inaccurate personal information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Request deletion of your personal information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Object to processing of your personal information</span>
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-5 w-5 text-primary" />
          <p>
            For privacy-related inquiries, please contact us at{" "}
            <a href="mailto:privacy@lawlens.io" className="text-primary hover:underline">
              privacy@lawlens.io
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
