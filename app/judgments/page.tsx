"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gavel,
  ArrowRight,
  Search,
  Scale,
  Building2,
  Landmark,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

// Court hierarchy for Uganda
const courtHierarchy = [
  {
    id: "supreme",
    name: "Supreme Court",
    shortName: "SC",
    description: "The highest court in Uganda. Final court of appeal.",
    icon: Scale,
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    level: 1,
  },
  {
    id: "court_of_appeal",
    name: "Court of Appeal",
    shortName: "CoA",
    description: "Hears appeals from the High Court. Also serves as Constitutional Court.",
    icon: Landmark,
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    level: 2,
  },
  {
    id: "high_court",
    name: "High Court",
    shortName: "HC",
    description: "Court of unlimited original jurisdiction. Hears appeals from lower courts.",
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    level: 3,
  },
  {
    id: "magistrate",
    name: "Magistrate Courts",
    shortName: "MC",
    description: "Handle criminal and civil matters at the local level.",
    icon: Gavel,
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    level: 4,
  },
];

// Quick search suggestions
const searchSuggestions = [
  { query: "land dispute", category: "Property" },
  { query: "employment termination", category: "Labor" },
  { query: "criminal appeal", category: "Criminal" },
  { query: "contract breach", category: "Commercial" },
];

export default function JudgmentsPage() {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRepositoryStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getJudgmentCount = (): number => {
    if (!stats) return 0;
    const found = stats.by_type.find((t) => t.document_type === "judgment");
    return found?.count || 0;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}&type=judgment`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className={`mb-8 ${surfaceClasses.pageHero}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={surfaceClasses.pageIconTile}>
            <Gavel className="h-6 w-6 text-brand-gold dark:text-primary" />
          </div>
          <div>
            <p className={surfaceClasses.pageEyebrow}>
              Case Law
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Court Judgments
            </h1>
            <p className="text-muted-foreground">
              Browse {isLoading ? "..." : getJudgmentCount().toLocaleString()} court decisions
            </p>
          </div>
        </div>

        {/* Search within judgments */}
        <form onSubmit={handleSearch} className="mt-6 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search case law..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-24 ${surfaceClasses.searchField}`}
            />
            <Button
              type="submit"
              size="sm"
              variant="brand"
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              Search
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {searchSuggestions.map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => setSearchQuery(item.query)}
                className={cn("text-xs", surfaceClasses.chipButton)}
              >
                {item.category}: {item.query}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Court Hierarchy Visual */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          Court Hierarchy
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </h2>

        <div className="relative">
          {/* Vertical line connecting courts */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 hidden md:block" />

          <div className="space-y-4">
            {courtHierarchy.map((court) => (
              <Link
                key={court.id}
                href={`/judgments/${court.id}`}
                className="group block"
              >
                <Card
                  className={cn(
                    "ml-0 border-2 md:ml-12",
                    surfaceClasses.pagePanelInteractive,
                    court.borderColor
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Level indicator */}
                        <div className="hidden md:flex absolute left-0 h-12 w-12 items-center justify-center">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-[border-color,background-color,color]",
                              court.borderColor
                            )}
                          >
                            <span className={cn("text-sm font-bold", court.color)}>
                              {court.level}
                            </span>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl border border-glass bg-surface-container-high transition-[background-color,border-color,box-shadow,transform]",
                            court.bgColor
                          )}
                        >
                          <court.icon className={cn("ll-icon-muted h-6 w-6", court.color)} />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {court.name}
                        <Badge variant="secondary" className="border border-glass text-xs">
                              {court.shortName}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {court.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <Skeleton className="h-6 w-12" />
                        ) : (
                        <Badge variant="outline" className="border-glass font-semibold">
                          Browse
                        </Badge>
                        )}
                        <ArrowRight className="ll-icon-muted h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Browse All */}
      <div className="border-t border-border/60 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Judgments</h2>
          <Button variant="outline" asChild>
            <Link href="/browse/judgments">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="border-glass bg-muted/30">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Browse the complete collection of court decisions without filtering by court level.
              Use advanced filters to search by date, case number, or subject matter.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/chat?q=Recent landmark Supreme Court decisions in Uganda`}>
                  Ask About Case Law
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/search?type=judgment">
                  Advanced Search
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Section */}
      <div className="mt-8 border-t border-border/60 pt-8">
        <h2 className="text-lg font-semibold mb-4">About Uganda&apos;s Court System</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium">Hierarchy of Courts</h3>
            <p className="text-sm text-muted-foreground">
              Uganda&apos;s court system follows a hierarchical structure established by the
              Constitution. The Supreme Court is the highest court, followed by the
              Court of Appeal (which also sits as the Constitutional Court), the High
              Court, and subordinate courts including Magistrate Courts.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Doctrine of Precedent</h3>
            <p className="text-sm text-muted-foreground">
              Decisions of higher courts are binding on lower courts. Supreme Court
              judgments have the highest precedential value. Understanding the court
              hierarchy helps in assessing the weight of legal authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
