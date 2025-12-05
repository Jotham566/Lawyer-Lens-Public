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
      "Lawyer Lens provides access to Acts of Parliament, Court Judgments from various levels (Supreme Court, Court of Appeal, High Court, etc.), Regulations and Statutory Instruments, and the Constitution of Uganda.",
  },
  {
    question: "Is the information on Lawyer Lens legally authoritative?",
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
      "Yes, you can download documents in PDF format or print them directly from the document viewer using the download and print buttons in the toolbar.",
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Help & FAQ
            </h1>
            <p className="text-muted-foreground">
              Learn how to use Lawyer Lens effectively
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
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
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b last:border-b-0"
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
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you couldn&apos;t find the answer to your question, please reach out
          to our support team. We&apos;re here to help you make the most of
          Lawyer Lens.
        </p>
      </section>
    </div>
  );
}
