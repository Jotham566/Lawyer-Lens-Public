"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  FileText,
  Gavel,
  ScrollText,
  Scale,
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";

const searchModes = [
  {
    value: "ai",
    label: "Smart Search",
    description: "Get answers with source citations",
    icon: "sparkles",
  },
  {
    value: "keyword",
    label: "Keyword Search",
    description: "Find exact terms in documents",
    icon: "search",
  },
];

const suggestedQueries = [
  {
    query: "What are the penalties for tax evasion?",
    category: "Tax Law",
  },
  {
    query: "Employment termination procedures",
    category: "Employment",
  },
  {
    query: "Land registration requirements",
    category: "Property",
  },
  {
    query: "Company incorporation process",
    category: "Corporate",
  },
  {
    query: "Criminal bail conditions",
    category: "Criminal",
  },
  {
    query: "Child custody rights",
    category: "Family",
  },
];

const quickActions = [
  {
    title: "Browse Acts",
    description: "Explore enacted legislation",
    icon: FileText,
    href: "/legislation/acts",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    title: "Find Case Law",
    description: "Search court judgments",
    icon: Gavel,
    href: "/judgments",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    title: "View Constitution",
    description: "The supreme law",
    icon: Scale,
    href: "/legislation/constitution",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
  },
  {
    title: "Regulations",
    description: "Statutory instruments",
    icon: ScrollText,
    href: "/legislation/regulations",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Instant Answers",
    description: "Get contextual answers with source citations in seconds",
  },
  {
    icon: Zap,
    title: "10x Faster Research",
    description: "Search thousands of documents in milliseconds",
  },
  {
    icon: Shield,
    title: "Authoritative Sources",
    description: "Official legislation and court judgments",
  },
  {
    icon: Clock,
    title: "Always Current",
    description: "Regularly updated legal database",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("ai");
  const [stats, setStats] = useState<RepositoryStats | null>(null);

  useEffect(() => {
    getRepositoryStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim());

      if (searchMode === "ai") {
        // Smart Search goes to chat for answers with citations
        router.push(`/chat?q=${query}`);
      } else {
        // Keyword Search goes to search page
        router.push(`/search?q=${query}&mode=keyword`);
      }
    }
  };

  const handleSuggestedQuery = (query: string) => {
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  // Helper to get count by type
  const getTypeCount = (type: string): number => {
    if (!stats) return 0;
    const found = stats.by_type.find((t) => t.document_type === type);
    return found?.count || 0;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-3xl mx-auto text-center">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Professional Legal Research
          </Badge>

          {/* Main Heading */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Ask anything about{" "}
            <span className="text-primary">Uganda&apos;s laws</span>
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Search legislation, case law, and regulations. Get instant answers
            with citations to authoritative sources.
          </p>

          {/* Stats Bar - Prominently Visible */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {stats ? stats.total_documents.toLocaleString() : "—"}
              </span>
              <span className="text-sm text-muted-foreground">Documents</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {stats ? getTypeCount("act").toLocaleString() : "—"}
              </span>
              <span className="text-sm text-muted-foreground">Acts</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/50">
              <Gavel className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {stats ? getTypeCount("judgment").toLocaleString() : "—"}
              </span>
              <span className="text-sm text-muted-foreground">Judgments</span>
            </div>
          </div>

          {/* Search Interface */}
          <div className="mt-8 w-full">
            {/* Search Mode Tabs */}
            <Tabs
              value={searchMode}
              onValueChange={setSearchMode}
              className="mb-4"
            >
              <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 h-10">
                {searchModes.map((mode) => (
                  <TabsTrigger
                    key={mode.value}
                    value={mode.value}
                    className="text-xs sm:text-sm"
                  >
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  {searchMode === "ai" ? (
                    <Sparkles className="h-5 w-5 text-primary" />
                  ) : (
                    <Search className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    searchMode === "keyword"
                      ? 'Search exact terms like "Income Tax Act"...'
                      : "Ask a legal question or search for documents..."
                  }
                  className="w-full h-14 sm:h-16 rounded-xl border bg-background pl-12 pr-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 sm:h-16 rounded-xl px-4 sm:px-6"
                disabled={!searchQuery.trim()}
              >
                <span className="hidden sm:inline mr-2">Search</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Mode Description */}
            <p className="mt-3 text-sm text-muted-foreground">
              {searchModes.find((m) => m.value === searchMode)?.description}
            </p>
          </div>

          {/* Suggested Queries */}
          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQueries.slice(0, 4).map((item) => (
                <button
                  key={item.query}
                  onClick={() => handleSuggestedQuery(item.query)}
                  className="group inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted hover:border-primary/50"
                >
                  <span className="text-xs text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground/80 group-hover:text-foreground">
                    {item.query}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-t bg-muted/30 px-4 py-10 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Quick Access</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/browse" className="text-muted-foreground">
                Browse all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group">
                  <CardContent className="p-4 md:p-5">
                    <div
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3 transition-transform group-hover:scale-105",
                        action.bgColor
                      )}
                    >
                      <action.icon className={cn("h-5 w-5", action.color)} />
                    </div>
                    <h3 className="font-medium text-sm md:text-base">
                      {action.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-10 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm md:text-base">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-4 bg-muted/20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Law Lens - Uganda Legal Intelligence Platform
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/help" className="hover:text-foreground transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
