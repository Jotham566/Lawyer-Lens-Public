import { Scale, Users, Target, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              About Law Lens
            </h1>
            <p className="text-muted-foreground">
              Uganda&apos;s Legal Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          Law Lens is dedicated to making Uganda&apos;s legal information accessible,
          searchable, and understandable. We provide legal professionals, researchers,
          students, and citizens with instant access to legislation, court judgments,
          and regulatory documents.
        </p>
      </section>

      {/* Features */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">What We Offer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Comprehensive Legal Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access thousands of Acts of Parliament, court judgments, regulations,
                and the Constitution of Uganda.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                Instant Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get quick answers to legal questions with citations to authoritative
                sources and relevant provisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                For Everyone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Whether you&apos;re a lawyer, student, researcher, or citizen,
                Law Lens helps you navigate Uganda&apos;s legal landscape.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-primary" />
                Authoritative Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All documents are sourced from official publications and verified
                for accuracy and completeness.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Legal Disclaimer</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The information provided on Law Lens is for general informational purposes
          only and does not constitute legal advice. While we strive to ensure accuracy,
          we make no warranties about the completeness or reliability of the information.
          For specific legal matters, please consult a qualified legal professional.
        </p>
      </section>
    </div>
  );
}
