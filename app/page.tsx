"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Gavel,
  ScrollText,
  Scale,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";

const documentTypes = [
  {
    title: "Acts",
    description: "Browse enacted legislation and statutes",
    icon: FileText,
    href: "/browse/acts",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Judgments",
    description: "Access court decisions and case law",
    icon: Gavel,
    href: "/browse/judgments",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Regulations",
    description: "Find regulatory instruments and rules",
    icon: ScrollText,
    href: "/browse/regulations",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Constitution",
    description: "The supreme law of Uganda",
    icon: Scale,
    href: "/browse/constitution",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
];

const suggestedQueries = [
  "What are the penalties for tax evasion?",
  "Employment termination procedures",
  "Land registration requirements",
  "Company incorporation process",
];

export default function HomePage() {
  const [stats, setStats] = useState<RepositoryStats | null>(null);

  useEffect(() => {
    getRepositoryStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  // Helper to get count by type
  const getTypeCount = (type: string): number => {
    if (!stats) return 0;
    const found = stats.by_type.find((t) => t.document_type === type);
    return found?.count || 0;
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/30 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered Legal Research
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Uganda&apos;s Legal Intelligence Platform
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
            Access laws, judgments, and regulations. Search with natural
            language and get AI-powered answers to your legal questions.
          </p>

          {/* Search Box */}
          <div className="mx-auto mt-8 max-w-2xl">
            <form action="/search" method="get" className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                placeholder="Search laws, cases, regulations..."
                className="h-14 w-full rounded-xl border bg-background pl-12 pr-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Quick Stats - Now from API */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats ? stats.total_documents.toLocaleString() : "—"}
              </span>
              <span>Documents</span>
            </div>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats ? getTypeCount("act").toLocaleString() : "—"}
              </span>
              <span>Acts</span>
            </div>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats ? getTypeCount("judgment").toLocaleString() : "—"}
              </span>
              <span>Judgments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Browse by Type
              </h2>
              <p className="mt-1 text-muted-foreground">
                Explore documents organized by category
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/browse">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {documentTypes.map((type) => (
              <Link key={type.href} href={type.href}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div
                      className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${type.bgColor}`}
                    >
                      <type.icon className={`h-5 w-5 ${type.color}`} />
                    </div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Teaser */}
      <section className="border-t bg-muted/30 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                <MessageSquare className="mr-1 h-3 w-3" />
                AI Legal Assistant
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight">
                Ask questions in plain language
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get instant answers to your legal questions. Our AI assistant
                searches through thousands of documents to find relevant
                information and provides citations.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/chat">
                  Try AI Assistant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Card className="bg-background">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Try asking...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQueries.map((query) => (
                  <Link
                    key={query}
                    href={`/chat?q=${encodeURIComponent(query)}`}
                    className="block rounded-lg border bg-muted/50 px-4 py-3 text-sm transition-colors hover:bg-muted"
                  >
                    &quot;{query}&quot;
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <p>Lawyer Lens - Uganda Legal Intelligence Platform</p>
            <div className="flex gap-4">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/legal" className="hover:text-foreground">
                Legal
              </Link>
              <Link href="/help" className="hover:text-foreground">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
