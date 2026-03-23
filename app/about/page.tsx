import { Scale, Users, Target, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs className="mb-6" />

      <section className="rounded-hero border border-border/60 bg-surface-container px-6 py-8 shadow-soft sm:px-8 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
          About
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
          About Law Lens Uganda
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
          Uganda&apos;s Legal Intelligence Platform
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-panel bg-surface-container-high px-6 py-6">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="mt-4 leading-8 text-muted-foreground">
              Law Lens Uganda is dedicated to making Uganda&apos;s legal information accessible,
              searchable, and understandable. We provide legal professionals, researchers,
              students, and citizens with instant access to legislation, court judgments,
              and regulatory documents.
            </p>
          </div>
          <div className="rounded-panel bg-surface-container-high px-6 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
              Positioning
            </p>
            <p className="mt-4 font-serif text-2xl font-semibold leading-tight text-foreground">
              A legal research surface that feels institutional, current, and authoritative.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mt-10">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
            Capabilities
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.02em] text-foreground">
            What We Offer
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60 bg-surface-container shadow-soft">
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

          <Card className="border-border/60 bg-surface-container shadow-soft">
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

          <Card className="border-border/60 bg-surface-container shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                For Everyone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Whether you&apos;re a lawyer, student, researcher, or citizen,
                Law Lens Uganda helps you navigate Uganda&apos;s legal landscape.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-surface-container shadow-soft">
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
      <section className="mt-10 rounded-panel border border-border/60 bg-surface-container px-6 py-6 shadow-soft">
        <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-foreground">Legal Disclaimer</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The information provided on Law Lens Uganda is for general informational purposes
          only and does not constitute legal advice. While we strive to ensure accuracy,
          we make no warranties about the completeness or reliability of the information.
          For specific legal matters, please consult a qualified legal professional.
        </p>
      </section>
    </div>
  );
}
