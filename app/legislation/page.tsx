"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ScrollText,
  BookOpen,
  Scale,
  ArrowRight,
  Search,
  Gavel,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { surfaceClasses } from "@/lib/design-system";
import { getRepositoryStats } from "@/lib/api";
import type { RepositoryStats } from "@/lib/api/types";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const legislationTypes = [
  {
    title: "Acts of Parliament",
    description:
      "Primary legislation enacted by Parliament. Browse acts by year, alphabetically, or search by title.",
    icon: FileText,
    href: "/legislation/acts",
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    countKey: "act",
  },
  {
    title: "Regulations",
    description:
      "Statutory instruments, rules, and subsidiary legislation made under Acts of Parliament.",
    icon: ScrollText,
    href: "/legislation/regulations",
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    countKey: "regulation",
  },
  {
    title: "Constitution",
    description:
      "The Constitution of the Republic of Uganda, 1995, as amended. The supreme law of the land.",
    icon: BookOpen,
    href: "/legislation/constitution",
    color: "text-primary",
    bgColor: "bg-muted",
    borderColor: "border-border/60",
    countKey: "constitution",
  },
];

export default function LegislationPage() {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRepositoryStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getTypeCount = (type: string): number => {
    if (!stats) return 0;
    const found = stats.by_type.find((t) => t.document_type === type);
    return found?.count || 0;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}&type=legislation`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className={cn("mb-8", surfaceClasses.pageHero)}>
        <div className="flex items-center gap-3 mb-4">
          <div className={surfaceClasses.pageIconTile}>
            <Scale className="h-6 w-6 text-brand-gold dark:text-primary" />
          </div>
          <div>
            <p className={surfaceClasses.pageEyebrow}>Legal Framework</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Legislation
            </h1>
            <p className="text-muted-foreground">
              Browse Uganda&apos;s legal framework
            </p>
          </div>
        </div>

        {/* Search within legislation */}
        <form onSubmit={handleSearch} className="mt-6 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search within legislation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-10 pr-24", surfaceClasses.searchField)}
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
        </form>
      </div>

      {/* Legislation Type Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {legislationTypes.map((type) => (
          <Link key={type.href} href={type.href} className="group">
            <Card
              className={cn(
                "h-full border-2",
                surfaceClasses.pagePanelInteractive,
                type.borderColor
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl border border-glass bg-surface-container-high transition-[background-color,border-color,box-shadow,transform]",
                      type.bgColor
                    )}
                  >
                    <type.icon className={cn("ll-icon-muted h-6 w-6", type.color)} />
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <Badge variant="secondary" className="text-lg font-semibold">
                      {getTypeCount(type.countKey).toLocaleString()}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl mt-3">{type.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {type.description}
                </p>
                <div className="flex items-center text-sm font-medium text-primary">
                  Browse {type.title.toLowerCase()}
                  <ArrowRight className="ll-icon-muted ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Case Law Section */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Case Law</h2>
        <Link href="/judgments" className="group">
        <Card
          className={cn(
              "border-2",
              surfaceClasses.pagePanelInteractive,
              "border-border/60"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border border-glass bg-surface-container-high transition-[background-color,border-color,box-shadow,transform]"
                  )}
                >
                  <Gavel className="ll-icon-muted h-6 w-6 text-primary" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <Badge variant="secondary" className="text-lg font-semibold">
                    {getTypeCount("judgment").toLocaleString()}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl mt-3">Court Judgments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Court decisions and case law from the Supreme Court, Court of Appeal, High Court, and other tribunals.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Browse judgments
                <ArrowRight className="ll-icon-muted ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Links Section */}
      <div className="border-t border-border/60 pt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            title="Income Tax Act"
            subtitle="Cap. 340"
            href="/search?q=Income Tax Act&type=act"
          />
          <QuickLink
            title="Companies Act"
            subtitle="Cap. 110"
            href="/search?q=Companies Act&type=act"
          />
          <QuickLink
            title="Employment Act"
            subtitle="Cap. 226"
            href="/search?q=Employment Act&type=act"
          />
          <QuickLink
            title="Land Act"
            subtitle="Cap. 227"
            href="/search?q=Land Act&type=act"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
      <Link
      href={href}
      className={cn("group flex items-center gap-3 rounded-lg border border-border/60 p-3", surfaceClasses.rowInteractive)}
    >
      <FileText className="ll-icon-muted h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  );
}
