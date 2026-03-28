"use client";

import {
  HelpCircle,
  Search,
  MessageSquare,
  BookOpen,
  Shield,
  FileText,
  CreditCard,
  ChevronRight,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DemoRequestModal } from "@/components/landing/demo-request-modal";

const faqs = [
  {
    question: "What can I do with Law Lens?",
    answer:
      "Law Lens supports legal research automation, citation-backed answers, case-law and legislation search, internal document intelligence, and compliance monitoring workflows.",
  },
  {
    question: "How do I search judgments and laws?",
    answer:
      "Use Case Law to search and analyze judgments, or Laws of Uganda to browse acts and legislation. You can also ask a legal question in natural language through Ask Ben, the legal research assistant.",
  },
  {
    question: "Are answers grounded in source law?",
    answer:
      "Law Lens is designed to provide citation-backed answers tied to source materials, including judgments, statutes, and regulations where applicable. Every response includes source references and confidence scoring.",
  },
  {
    question: "Is Law Lens a substitute for legal advice?",
    answer:
      "No. Law Lens supports research and analysis, but legal professionals and organizations should still apply legal judgment and review source materials appropriately.",
  },
  {
    question: "Can organizations upload internal documents?",
    answer:
      "Yes. Depending on plan and configuration, organizations can bring internal contracts, policies, and records into a private knowledge environment for search, analysis, and workflow support.",
  },
  {
    question: "What is the Private Organizational Knowledge Base?",
    answer:
      "It is an enterprise capability that allows organizations to ingest and work with internal documents in a secure, searchable legal intelligence workspace.",
  },
  {
    question: "How does compliance monitoring work?",
    answer:
      "Law Lens helps surface obligations, track regulatory developments, monitor risk, and support compliance-related review across organizational records and workflows.",
  },
  {
    question: "Which plans are available?",
    answer:
      "Law Lens offers plans for solo practitioners, teams, and enterprise/institutional deployments. See the Pricing page for current plan details and feature comparisons.",
  },
  {
    question: "How do I request a demo or enterprise setup?",
    answer:
      "Use the Request Demo option available on the site, or contact the team through the support and sales channels provided below.",
  },
  {
    question: "How do I get help?",
    answer:
      "If you need support, reach out to the team through email or the contact form. For enterprise onboarding, use the Request Demo flow.",
  },
];

const quickLinks = [
  {
    title: "Ask Ben",
    description: "Ask legal questions and get citation-backed answers",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Case Law",
    description: "Search and analyze judgments",
    href: "/judgments",
    icon: Search,
  },
  {
    title: "Laws of Uganda",
    description: "Explore Acts, regulations, and legal sources",
    href: "/legislation/acts",
    icon: BookOpen,
  },
  {
    title: "Regulatory Compliance",
    description: "Monitor obligations, risk, and regulatory developments",
    href: "/compliance",
    icon: Shield,
  },
  {
    title: "Internal Knowledge Base",
    description: "Search contracts, policies, and internal records",
    href: "/knowledge-base",
    icon: FileText,
  },
  {
    title: "Pricing",
    description: "Compare plans for solo, team, and enterprise use",
    href: "/pricing",
    icon: CreditCard,
  },
];

export default function HelpPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="px-6 py-10 lg:px-12 xl:px-20">
      {/* Header */}
      <section className="mb-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
              <HelpCircle className="h-6 w-6 text-brand-gold" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                Support
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
                Help & FAQ
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Guidance on using Law Lens for legal research, grounded answers,
                internal knowledge workflows, and compliance monitoring.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface-container-low p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              Quick Start
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Start with <strong>Ask Ben</strong> to search the law in plain language.
              Browse <strong>Case Law</strong> for judgments or <strong>Laws of Uganda</strong> for
              legislation. Save documents to your library from any page.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mb-10">
        <h2 className="text-xl font-extrabold tracking-tight mb-4">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full border-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{link.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-extrabold tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-border/40"
            >
              <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Need More Help — actionable */}
      <section className="rounded-xl border-2 border-brand-gold/20 bg-primary/[0.03] p-8 dark:bg-primary/[0.06]">
        <h2 className="text-lg font-bold tracking-tight">Need More Help?</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          For support, onboarding, or enterprise questions, contact the team and
          we&apos;ll point you to the right next step.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
          >
            Request a Demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="mailto:hello@lawlens.io"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-6 py-2.5 text-sm font-bold text-foreground transition-all hover:border-border hover:shadow-soft"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </section>

      <DemoRequestModal open={showDemoModal} onOpenChange={setShowDemoModal} />
    </div>
  );
}
