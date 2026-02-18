"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  FileText,
  Gavel,
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  Shield,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";
import { useAuth } from "@/components/providers";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { BetaAnnouncementBanner, BetaAccessModal } from "@/components/beta";

const searchModes = [
  {
    value: "ai",
    label: "Ask in Plain English",
    description: "Get AI-powered answers with exact citations from legislation and case law",
    icon: "sparkles",
    requiresAuth: true,
  },
  {
    value: "keyword",
    label: "Search Documents",
    description: "Find specific terms across all acts, judgments, and regulations",
    icon: "search",
    requiresAuth: false,
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


export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("ai");
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);

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
        // Smart Search requires authentication for chat
        if (!isAuthenticated) {
          // Store the intended destination with query and show login modal
          openLogin(`/chat?q=${query}`);
          return;
        }
        router.push(`/chat?q=${query}`);
      } else {
        // Keyword Search is available to all users
        router.push(`/search?q=${query}&mode=keyword`);
      }
    }
  };

  const handleSuggestedQuery = (query: string) => {
    // Suggested queries go to Smart Search (chat), require auth
    if (!isAuthenticated) {
      openLogin(`/chat?q=${encodeURIComponent(query)}`);
      return;
    }
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
      {/* Beta Announcement Banner */}
      <BetaAnnouncementBanner onJoinClick={() => setShowBetaModal(true)} />

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
            Search Uganda&apos;s Laws{" "}
            <span className="text-primary">in Plain English</span>
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A semantic search engine connecting Uganda&apos;s entire legal corpus—laws,
            judgments, and regulations—into one interactive, citation-accurate knowledge base.
          </p>

          {/* Trust Strip */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" />Natural Language</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" />99% Traceable</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" />No Hallucinations</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" />Amendment Detection</span>
          </div>

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
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-11">
                {searchModes.map((mode) => (
                  <TabsTrigger
                    key={mode.value}
                    value={mode.value}
                    className="text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    {mode.value === "ai" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span>{mode.label}</span>
                    {mode.requiresAuth && !isAuthenticated && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                    {!mode.requiresAuth && (
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                        FREE
                      </span>
                    )}
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
                      ? 'e.g. "Income Tax Act 1997" or "constitutional petition"...'
                      : "e.g. What are the grounds for divorce in Uganda?"
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

      {/* Beta Access Modal */}
      <BetaAccessModal open={showBetaModal} onOpenChange={setShowBetaModal} />
    </div>
  );
}
