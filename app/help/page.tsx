import {
  HelpCircle,
  Search,
  MessageSquare,
  BookMarked,
  FileText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const faqs = [
  {
    question: "How do I search for legal documents?",
    answer:
      "Use the search bar on the homepage or navigate to the Search page. You can search by keywords, document title, act number, or case number. Use filters to narrow results by document type, year, or court level.",
  },
  {
    question: "What is the Legal Assistant?",
    answer:
      "The Legal Assistant helps you find answers to legal questions. Simply type your question in natural language, and you'll receive an answer with citations to relevant legal provisions and documents.",
  },
  {
    question: "How do I save documents to my library?",
    answer:
      "When viewing any document, click the bookmark icon to save it to your library. You can access your saved documents anytime from the Library page.",
  },
  {
    question: "What types of documents are available?",
    answer:
      "Law Lens Uganda provides access to Acts of Parliament, Court Judgments from various levels (Supreme Court, Court of Appeal, High Court, etc.), Regulations and Statutory Instruments, and the Constitution of Uganda.",
  },
  {
    question: "Is the information on Law Lens Uganda legally authoritative?",
    answer:
      "While we source our documents from official publications, the information is provided for reference purposes only. For legal proceedings or advice, always verify with official gazettes or consult a qualified legal professional.",
  },
  {
    question: "How current is the legal database?",
    answer:
      "We regularly update our database with new legislation and court decisions. However, there may be a short delay between official publication and availability on our platform.",
  },
  {
    question: "Can I download or print documents?",
    answer:
      "You can read and print documents directly from the document viewer. Public document downloads are not available from the web interface.",
  },
  {
    question: "How do I navigate within a long document?",
    answer:
      "Use the Table of Contents sidebar on the left side of the document viewer. You can click on any section heading to jump directly to that part of the document.",
  },
];

const quickLinks = [
  {
    title: "Search Documents",
    description: "Find acts, judgments, and regulations",
    href: "/search",
    icon: Search,
  },
  {
    title: "Legal Assistant",
    description: "Ask questions and get answers",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "My Library",
    description: "View saved documents",
    href: "/library",
    icon: BookMarked,
  },
  {
    title: "Browse Legislation",
    description: "Explore acts and regulations",
    href: "/legislation",
    icon: FileText,
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs className="mb-6" />

      <section className="rounded-hero border border-border/60 bg-surface-container px-6 py-8 shadow-soft sm:px-8 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
                Support
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
                Help & FAQ
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Learn how to use Law Lens Uganda effectively
              </p>
            </div>
          </div>
          <div className="rounded-panel bg-surface-container-high px-5 py-4 sm:max-w-xs">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
              Guidance
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The support surface keeps navigation, search, research, and citation guidance in one calm, scannable place.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mt-10">
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-foreground">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full border-border/60 bg-surface-container shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:border-border/80">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{link.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-foreground">Frequently Asked Questions</h2>
        <Card className="mt-4 border-border/60 bg-surface-container shadow-soft">
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                  <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Contact */}
      <section className="mt-10 rounded-panel border border-border/60 bg-surface-container px-6 py-6 shadow-soft">
        <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-foreground">Need More Help?</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          If you couldn&apos;t find the answer to your question, please reach out
          to our support team. We&apos;re here to help you make the most of
          Law Lens Uganda.
        </p>
      </section>
    </div>
  );
}
