import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Terms of Service
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
          Welcome to Law Lens. By accessing or using our legal research platform,
          you agree to be bound by these Terms of Service. Please read them carefully
          before using our services.
        </p>
      </section>

      {/* Acceptance of Terms */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground leading-relaxed">
          By creating an account or using Law Lens, you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Service and our Privacy Policy.
          If you do not agree to these terms, please do not use our services.
        </p>
      </section>

      {/* Permitted and Prohibited Uses */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">2. Use of Services</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-600">
                <CheckCircle className="h-5 w-5" />
                Permitted Uses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Legal research and analysis</li>
                <li>Educational purposes</li>
                <li>Professional legal practice</li>
                <li>Academic research</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-red-600">
                <XCircle className="h-5 w-5" />
                Prohibited Uses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Unauthorized commercial redistribution</li>
                <li>Automated scraping or data mining</li>
                <li>Circumventing access controls</li>
                <li>Misrepresenting information source</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Account Responsibilities */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">3. Account Responsibilities</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>You are responsible for maintaining the confidentiality of your account credentials</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>You agree to notify us immediately of any unauthorized use of your account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>You are responsible for all activities that occur under your account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>You must provide accurate and complete information when creating an account</span>
          </li>
        </ul>
      </section>

      {/* Intellectual Property */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The Law Lens platform, including its design, features, and original content, is protected
          by intellectual property laws. Legal documents sourced from official government publications
          are in the public domain.
        </p>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>You may use legal documents for lawful purposes with proper attribution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>Platform features, branding, and original content remain our property</span>
          </li>
        </ul>
      </section>

      {/* Disclaimer */}
      <section className="mb-10">
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Important Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <strong>Law Lens is not a substitute for professional legal advice.</strong> The information
              provided on our platform is for general informational purposes only. We make no warranties
              about the accuracy, completeness, or reliability of the information. For specific legal
              matters, please consult a qualified legal professional licensed to practice in Uganda.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
        <p className="text-muted-foreground leading-relaxed">
          To the maximum extent permitted by law, Law Lens shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages resulting from your use of or
          inability to use our services, even if we have been advised of the possibility of such damages.
        </p>
      </section>

      {/* Governing Law */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">6. Governing Law</h2>
        <div className="flex items-start gap-3">
          <Scale className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground leading-relaxed">
            These Terms of Service shall be governed by and construed in accordance with the laws
            of the Republic of Uganda. Any disputes arising from these terms shall be subject to
            the exclusive jurisdiction of the courts of Uganda.
          </p>
        </div>
      </section>

      {/* Changes to Terms */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
        <p className="text-muted-foreground leading-relaxed">
          We reserve the right to modify these Terms of Service at any time. We will notify users
          of significant changes by posting a notice on our platform or sending an email to registered
          users. Your continued use of the platform after such modifications constitutes acceptance
          of the updated terms.
        </p>
      </section>

      {/* Contact */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-5 w-5 text-primary" />
          <p>
            For questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:legal@lawlens.io" className="text-primary hover:underline">
              legal@lawlens.io
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
