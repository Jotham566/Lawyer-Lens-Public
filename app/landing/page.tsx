"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Shield,
  FileSearch,
  GitCompare,
  BookOpen,
  ArrowRight,
  Scale,
  Building2,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AnimatedSection } from "@/components/landing";
import { getRepositoryStats, getPublicBetaMode } from "@/lib/api";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { BetaAccessModal } from "@/components/beta/beta-access-modal";
import { DemoRequestModal } from "@/components/landing/demo-request-modal";



/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   One composed narrative surface. Fewer components,
   stronger typography, more restraint, more proof.
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { openRegister } = useAuthModal();
  const [betaEnabled, setBetaEnabled] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Force scroll to top on mount/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check beta mode
  useEffect(() => {
    getPublicBetaMode()
      .then((res) => setBetaEnabled(res.enabled))
      .catch(() => {});
  }, []);

  const handleGetStarted = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (betaEnabled) {
        setShowWaitlist(true);
      } else {
        openRegister();
      }
    },
    [betaEnabled, openRegister]
  );

  const { data: stats } = useQuery({
    queryKey: ["repository-stats"],
    queryFn: getRepositoryStats,
    staleTime: 5 * 60 * 1000,
  });

  const totalDocuments = stats?.total_documents;

  return (
    <>
      {/* ─────────────────────────────────────────────────────
          HERO — One message, one CTA, one proof element
          ───────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-40 pb-0 lg:pt-48">
        {/* Background — restrained */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent dark:from-primary/[0.06]" />
        </div>

        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
              {/* Left — Message */}
              <div className="lg:col-span-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Legal Intelligence Platform
                </p>
                <h1 className="mt-4 font-sans text-[2.75rem] font-extrabold leading-[1.08] tracking-tight lg:text-[3.5rem]">
                  Search the Law.{" "}
                  <br className="hidden sm:block" />
                  Understand Risk.{" "}
                  <br className="hidden sm:block" />
                  <span className="text-brand-gold">Stay Ahead of Change.</span>
                </h1>
                <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
                  Law Lens helps institutions automate legal research, unlock
                  insight from internal records, and stay ahead of compliance
                  obligations and regulatory change.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
                  >
                    Request a Demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="inline-flex h-12 items-center rounded-full border border-border/60 bg-card/80 px-8 text-sm font-bold text-foreground backdrop-blur-sm transition-all hover:border-border hover:bg-card hover:shadow-soft"
                  >
                    Get Started
                  </button>
                </div>

                {/* Trust line — two strong claims, no word-break on mobile */}
                <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                  <span className="whitespace-nowrap">Every&nbsp;answer&nbsp;grounded&nbsp;in&nbsp;law</span>
                  <span className="mx-3 inline-block h-3 w-px align-middle bg-border/40" />
                  <span className="whitespace-nowrap">Built&nbsp;for&nbsp;institutions</span>
                </p>
              </div>

              {/* Right — Real product screenshot, visually dominant */}
              <div className="lg:col-span-7">
                <div className="overflow-hidden rounded-xl border border-border/50 shadow-xl dark:border-glass/40">
                  <Image
                    src="/images/proof/hero-case-law.png"
                    alt="Case Law search with AI case summaries, court filters, and judgment cards"
                    width={1400}
                    height={900}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Stats strip — compact confidence band */}
        <AnimatedSection variant="fade-up" delay={200}>
          <div className="mt-14 border-y border-border/30">
            <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-border/30 sm:grid-cols-4">
              {[
                { figure: totalDocuments ? `${totalDocuments}+` : "—", label: "Documents indexed" },
                { figure: "99%", label: "Citation accuracy" },
                { figure: "<3s", label: "Avg. response" },
                { figure: "Live", label: "Uganda" },
              ].map((stat) => (
                <div key={stat.label} className="px-6 py-5 text-center">
                  <span className="block text-2xl font-extrabold tracking-tight">
                    {stat.figure}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ─────────────────────────────────────────────────────
          PROBLEM / VALUE — Institutional clarity
          ───────────────────────────────────────────────────── */}
      <section className="py-14 lg:py-16">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <div className="grid gap-12 md:grid-cols-2 md:gap-0">
              {/* Why It Matters */}
              <div className="md:border-r md:border-border/30 md:pr-12 lg:pr-16">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Why It Matters
                </p>
                <h2 className="mt-3 text-[22px] font-extrabold leading-snug tracking-tight lg:text-2xl">
                  Legal research is slow. Compliance is reactive. Information is buried.
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
                  Judgments, statutes, contracts, policies, PDFs, shared drives,
                  and internal archives contain the information institutions need
                  — but not in a form that is easy to search, monitor, or act on.
                  The result is time-consuming research, limited visibility, and
                  compliance teams that are forced to react instead of stay ahead.
                </p>
              </div>

              {/* Why Law Lens */}
              <div className="md:pl-12 lg:pl-16">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Why Law Lens
                </p>
                <h2 className="mt-3 text-[22px] font-extrabold leading-snug tracking-tight lg:text-2xl">
                  Faster answers. Grounded in law. Built for action.
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
                  Law Lens turns judgments, laws, contracts, and internal records
                  into usable legal intelligence — helping institutions automate
                  legal research, surface risk, and stay ahead of compliance
                  obligations and regulatory change.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          HOW IT WORKS — Process rhythm, not cards
          ───────────────────────────────────────────────────── */}
      <section id="product" className="border-t border-border/30 py-12 lg:py-14">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              How It Works
            </p>
            <h2 className="mt-3 max-w-md text-2xl font-extrabold tracking-tight lg:text-3xl">
              From fragmented records to usable legal intelligence
            </h2>

            <div className="mt-10 grid gap-0 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Connect your internal records",
                  description:
                    "Bring in contracts, policies, compliance documents, and other internal materials. Judgments, laws, and regulations are already indexed.",
                },
                {
                  step: "02",
                  title: "Retrieve insight instantly",
                  description:
                    "Search in plain language, automate legal research, and generate grounded answers from the legal corpus and your internal records.",
                },
                {
                  step: "03",
                  title: "Monitor what needs attention",
                  description:
                    "Track legal risk, compliance obligations, contract events, and regulatory developments before they become problems.",
                },
              ].map((pillar, i) => (
                <div
                  key={pillar.step}
                  className={`relative ${i < 2 ? "md:border-r md:border-border/30 md:pr-8 lg:pr-10" : ""} ${i > 0 ? "mt-8 md:mt-0 md:pl-8 lg:pl-10" : ""}`}
                >
                  <span className="text-3xl font-extrabold text-brand-gold/20">
                    {pillar.step}
                  </span>
                  <h3 className="mt-1.5 text-[15px] font-bold tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          USE CASES — Strongest section, keep as list
          ───────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-border/30 py-12 lg:py-14">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              Use Cases
            </p>
            <h2 className="mt-3 max-w-lg text-2xl font-extrabold tracking-tight lg:text-3xl">
              Built for practical legal and compliance work
            </h2>

            <div className="mt-10 divide-y divide-border/30">
              {[
                {
                  icon: Search,
                  title: "Legal Research Automation",
                  description:
                    "Find relevant judgments, laws, and regulations faster.",
                },
                {
                  icon: FileSearch,
                  title: "Contract Review, Risk & Renewal Monitoring",
                  description:
                    "Surface legal exposure, track agreements that need attention, and assess contract terms against applicable requirements.",
                },
                {
                  icon: Shield,
                  title: "Policy & SOP Compliance Review",
                  description:
                    "Check internal policies and operating procedures against current legal and regulatory requirements.",
                },
                {
                  icon: GitCompare,
                  title: "Regulatory Change Monitoring",
                  description:
                    "Track legal and regulatory developments and understand how they may affect your organization.",
                },
                {
                  icon: BookOpen,
                  title: "Internal Knowledge Retrieval",
                  description:
                    "Turn contracts, policies, and archived records into searchable, usable intelligence.",
                },
              ].map((uc) => (
                <div
                  key={uc.title}
                  className="grid grid-cols-1 items-start gap-3 py-5 lg:grid-cols-[auto_280px_1fr] lg:items-center lg:gap-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                    <uc.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[15px] font-bold tracking-tight">
                    {uc.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {uc.description}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          WHO IT'S FOR — Structured list, not heavy cards
          ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/30 py-12 lg:py-14">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
              {/* Left — heading */}
              <div className="lg:col-span-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Who It&apos;s For
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight lg:text-3xl">
                  Institutions where legal accuracy, speed, and efficiency matter
                </h2>
              </div>

              {/* Right — structured list */}
              <div className="lg:col-span-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    {
                      icon: Scale,
                      title: "Judiciary, Courts & Tribunals",
                      description:
                        "Improve access to judgments, laws, and legal materials while reducing time spent on manual research.",
                    },
                    {
                      icon: Building2,
                      title: "Law Firms",
                      description:
                        "Accelerate legal research, strengthen internal knowledge retrieval, and improve contract and advisory workflows.",
                    },
                    {
                      icon: Globe,
                      title: "Regulators & Tax Teams",
                      description:
                        "Monitor legal and regulatory developments, review obligations, and respond faster to change.",
                    },
                    {
                      icon: Shield,
                      title: "Corporate Legal & Compliance",
                      description:
                        "Strengthen oversight across contracts, policies, internal records, and compliance requirements.",
                    },
                  ].map((a) => (
                    <div key={a.title} className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                        <a.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold tracking-tight">
                          {a.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {a.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          PRODUCT PROOF 1 — Grounded Legal Research
          ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/30 py-14 lg:py-16">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
              {/* Text — left, narrower */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Citation-Backed Legal Research
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight lg:text-3xl">
                  Every answer grounded in verifiable legal text
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
                  Search judgments, statutes, and regulations in plain language.
                  Every response includes exact section references, verified
                  sources, and confidence scoring — giving legal teams a
                  stronger starting point for review.
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-brand-gold/70">
                  {totalDocuments ? `${totalDocuments}+` : "—"} documents indexed across Uganda&apos;s legal corpus
                </p>
              </div>
              {/* Screenshot — right, constrained */}
              <div>
                <div className="max-h-[460px] overflow-hidden rounded-xl border border-border/50 shadow-lg dark:border-glass/40">
                  <Image
                    src="/images/proof/judgment-analysis.png"
                    alt="Judgment analysis with PDF viewer, grounded AI summary, and verified citation sources"
                    width={1400}
                    height={900}
                    className="h-auto w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          PRODUCT PROOF 2 — Compliance Intelligence
          ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/30 py-10 lg:py-14">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <div className="grid items-center gap-10 lg:grid-cols-[7fr_5fr] lg:gap-14">
              {/* Screenshot — left, dominant */}
              <div className="order-2 lg:order-1">
                <div className="max-h-[460px] overflow-hidden rounded-xl border border-border/50 shadow-lg dark:border-glass/40">
                  <Image
                    src="/images/proof/compliance-intelligence.png"
                    alt="Compliance intelligence dashboard with risk trajectory, critical risk registry, and SOP adherence monitoring"
                    width={1400}
                    height={900}
                    className="h-auto w-full object-cover object-top"
                  />
                </div>
              </div>
              {/* Text — right */}
              <div className="order-1 lg:order-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Compliance & Regulatory Monitoring
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight lg:text-3xl">
                  Track obligations, surface risk, stay ahead of change
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-muted-foreground">
                  Monitor compliance posture across your organization.
                  Track contract renewals, regulatory directives, SOP adherence,
                  and legal risk — with alerts to help surface issues before
                  deadlines and obligations are missed.
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-brand-gold/70">
                  Proactive alerts for contract renewals and regulatory change
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          FINAL CTA — One message, one action
          ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/30 py-12 lg:py-14">
        <div className="px-6 lg:px-12 xl:px-20">
          <AnimatedSection variant="fade-up">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight lg:text-[2.25rem] lg:leading-tight">
                See how Law Lens can support your institution.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Faster research, grounded answers, and clearer visibility into
                legal risk, compliance, and regulatory change.
              </p>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
                >
                  Request a Demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Modals */}
      <BetaAccessModal open={showWaitlist} onOpenChange={setShowWaitlist} />
      <DemoRequestModal open={showDemoModal} onOpenChange={setShowDemoModal} />
    </>
  );
}
