import type { Metadata } from "next";
import { Scale, Globe, Users, BookOpen, Target, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Law Lens is building the legal intelligence infrastructure for Africa — making legislation, case law, and regulations accessible through AI.",
};

const values = [
  {
    icon: Shield,
    title: "Accuracy First",
    description:
      "Every answer is grounded in actual legal text. We never generate information that isn't supported by the source material.",
  },
  {
    icon: Globe,
    title: "Africa-Focused",
    description:
      "We build specifically for African legal systems — understanding the unique structures, languages, and needs of each jurisdiction.",
  },
  {
    icon: Users,
    title: "Practitioner-Led",
    description:
      "Developed in collaboration with practicing lawyers, judges, and legal researchers who use the platform daily.",
  },
  {
    icon: BookOpen,
    title: "Comprehensive Coverage",
    description:
      "We aim to include every Act, statutory instrument, court judgment, and regulatory document — not just a selection.",
  },
];

export default function LandingAboutPage() {
  return (
    <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="mx-auto px-6 lg:px-12 xl:px-16">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
            About Law Lens
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight lg:text-5xl">
            Legal intelligence infrastructure for Africa
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            We&apos;re on a mission to make Africa&apos;s legal information accessible,
            structured, and searchable — enabling legal professionals, businesses, and
            citizens to find the law they need in seconds, not hours.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="mt-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-transparent bg-card p-10 shadow-soft dark:border-glass">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To democratize access to legal information across Africa by building
              AI-powered tools that make legislation, case law, and regulatory
              documents instantly searchable and understandable in natural language.
            </p>
          </div>

          <div className="rounded-2xl border border-transparent bg-card p-10 shadow-soft dark:border-glass">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
              <Scale className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Our Vision</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A continent where every legal professional has instant access to their
              jurisdiction&apos;s complete legal corpus — structured, cross-referenced, and
              powered by AI that understands legal context.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Our Values
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
              What guides us
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high text-foreground">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Journey */}
        <div className="mt-20 rounded-2xl bg-surface-container-low p-10 lg:p-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold">Our Journey</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Law Lens started with a simple observation: legal information in
              Africa is fragmented, hard to access, and often outdated. Lawyers
              spend countless hours searching through physical volumes and
              disconnected databases. We built Law Lens to change that — starting
              with Uganda, where we&apos;ve digitized and structured the complete
              legislative corpus and a growing collection of court judgments.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Today, we&apos;re expanding to Kenya, Tanzania, and Rwanda — with the
              goal of covering the entire East African Community and beyond.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
