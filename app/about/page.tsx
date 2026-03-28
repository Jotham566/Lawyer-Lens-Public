import {
  Search,
  Shield,
  FileSearch,
  GitCompare,
  BookOpen,
  Scale,
  Building2,
  Globe,
  Briefcase,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="px-6 py-10 lg:px-12 xl:px-20">
      {/* Hero — generous, sets the tone */}
      <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
            About
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight lg:text-4xl">
            About Law Lens Uganda
          </h1>
          <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
            Law Lens Uganda is a legal intelligence platform built to help
            institutions and legal professionals search the law faster, work with
            grounded legal answers, and stay ahead of legal risk, compliance, and
            regulatory change.
          </p>
        </div>
        {/* Anchor panel — institutional positioning */}
        <div className="flex flex-col justify-center rounded-xl border border-brand-gold/20 bg-primary/[0.03] p-8 dark:bg-primary/[0.06]">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
            Our Focus
          </p>
          <h2 className="mt-3 text-xl font-extrabold tracking-tight lg:text-2xl">
            Built for institutions where legal accuracy, trust, and timeliness matter
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-muted-foreground">
            We are building Law Lens to make judgments, laws, contracts, policies,
            and internal records searchable, usable, and actionable — without
            forcing teams to work through fragmented PDFs, drives, archives, and
            manual compliance workflows.
          </p>
        </div>
      </section>

      {/* What We Do — 2×2 grid, the largest section */}
      <section className="mt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
          What We Do
        </p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
          Core capabilities
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border/40 bg-border/40 sm:grid-cols-2 dark:border-glass/40 dark:bg-glass/40">
          {[
            {
              icon: Search,
              title: "Legal Research Automation",
              description:
                "Search judgments, statutes, and regulations in plain language and get to relevant authorities faster.",
            },
            {
              icon: Shield,
              title: "Grounded Legal Intelligence",
              description:
                "Work with citation-backed answers, verified sources, and traceable legal analysis.",
            },
            {
              icon: BookOpen,
              title: "Internal Knowledge Intelligence",
              description:
                "Turn contracts, policies, employee records, and archived documents into usable institutional knowledge.",
            },
            {
              icon: GitCompare,
              title: "Compliance & Regulatory Monitoring",
              description:
                "Track obligations, surface legal exposure, and understand how legal and regulatory change may affect the organization.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 bg-card p-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                <item.icon className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who We Serve — compact list */}
      <section className="mt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
          Who We Serve
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { icon: Scale, label: "Judiciary, courts & tribunals" },
            { icon: Building2, label: "Law firms" },
            { icon: Globe, label: "Regulators & tax teams" },
            { icon: FileSearch, label: "Corporate legal & compliance" },
            { icon: Briefcase, label: "Solo practitioners" },
          ].map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2.5 rounded-full border border-border/40 bg-card px-5 py-2.5 text-sm font-semibold dark:border-glass/40"
            >
              <item.icon className="h-4 w-4 text-brand-gold" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Why It Matters — elevated, more weight */}
      <section className="mt-16 border-t-2 border-brand-gold/20 bg-primary/[0.03] -mx-6 px-6 py-14 lg:-mx-12 lg:px-12 xl:-mx-20 xl:px-20 dark:bg-primary/[0.06]">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              Why It Matters
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight lg:text-3xl">
              From reactive legal work to informed action
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-[15px] leading-[1.75] text-muted-foreground">
              Legal and regulatory information is often available, but not
              operationally usable. Law Lens is built to reduce research time,
              improve visibility, and help institutions move from reactive legal
              work to more informed action.
            </p>
            <p className="mt-4 text-[15px] leading-[1.75] text-muted-foreground">
              By making judgments, laws, contracts, and internal records
              searchable and actionable in one system, we help legal and
              compliance teams spend less time searching and more time on work
              that matters.
            </p>
          </div>
        </div>
      </section>

      {/* Closing — compact */}
      <section className="mt-14 rounded-xl border border-border/40 bg-surface-container-low p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
          Uganda-First
        </p>
        <h2 className="mt-3 text-lg font-bold tracking-tight">
          Built for institutional adoption
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          We are starting with Uganda&apos;s legal and regulatory landscape,
          with a focus on building trusted tools that fit how legal and
          compliance work actually happens.
        </p>
      </section>
    </div>
  );
}
