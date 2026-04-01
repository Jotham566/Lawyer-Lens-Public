"use client";

import { useState } from "react";
import { Search, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers";
import {
  searchKnowledgeBase,
  type DocumentSearchResult,
} from "@/lib/api/knowledge-base";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  contract: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  policy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sop: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  employee_agreement: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  governance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  compliance_record: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  license: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  financial: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  correspondence: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

/* ─────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────── */

function highlightText(text: string, query: string) {
  if (!query) return text;
  try {
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="rounded bg-brand-gold/20 px-0.5 text-foreground"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  } catch {
    return text;
  }
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : pct >= 60
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        color,
      )}
    >
      {pct}% match
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────── */

export function SearchInternal() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!isAuthenticated || !query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const response = await searchKnowledgeBase(query.trim());
      setResults(response.results);
      if (response.results.length === 0) {
        toast.info("No results found", {
          description: "Try different search terms",
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Centered Search Bar */}
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search your organization's documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 pl-12 pr-24 text-base rounded-xl border-border/60 shadow-soft"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
              searching || !query.trim()
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-brand-gold text-white hover:bg-brand-gold/90",
            )}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="mt-4 text-lg font-bold">No results found</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try different search terms or check your documents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => {
                const resultAny = result as unknown as Record<string, unknown>;
                const category = resultAny.category as string | undefined;

                return (
                  <div
                    key={result.chunk_id}
                    className="rounded-xl border border-transparent bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-floating dark:border-glass"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10">
                        <FileText className="h-5 w-5 text-brand-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold">
                            {result.document_title}
                          </h4>
                          <ScoreBadge score={result.score} />
                          {category && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                                CATEGORY_COLORS[category] ??
                                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
                              )}
                            >
                              {category.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>

                        {(result.section_heading || result.page_number) && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {result.section_heading && (
                              <span className="mr-3">
                                Section: {result.section_heading}
                              </span>
                            )}
                            {result.page_number && (
                              <span>Page {result.page_number}</span>
                            )}
                          </p>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {highlightText(result.chunk_text, query)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold/10">
            <Search className="h-8 w-8 text-brand-gold/60" />
          </div>
          <h3 className="mt-4 text-lg font-bold">
            Search Internal Documents
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Enter a search query to find relevant content in your
            organization&apos;s documents
          </p>
        </div>
      )}
    </div>
  );
}
