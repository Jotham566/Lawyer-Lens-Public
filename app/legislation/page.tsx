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
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-200 dark:border-blue-800",
    countKey: "act",
  },
  {
    title: "Regulations",
    description:
      "Statutory instruments, rules, and subsidiary legislation made under Acts of Parliament.",
    icon: ScrollText,
    href: "/legislation/regulations",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    borderColor: "border-green-200 dark:border-green-800",
    countKey: "regulation",
  },
  {
    title: "Constitution",
    description:
      "The Constitution of the Republic of Uganda, 1995, as amended. The supreme law of the land.",
    icon: BookOpen,
    href: "/legislation/constitution",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
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
              className="pl-10 pr-24"
            />
            <Button
              type="submit"
              size="sm"
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
                "h-full transition-all hover:shadow-lg hover:border-primary/40 border-2",
                type.borderColor
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                      type.bgColor
                    )}
                  >
                    <type.icon className={cn("h-6 w-6", type.color)} />
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
                <div className="flex items-center text-sm text-primary font-medium group-hover:underline">
                  Browse {type.title.toLowerCase()}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              "transition-all hover:shadow-lg hover:border-primary/40 border-2",
              "border-purple-200 dark:border-purple-800"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                    "bg-purple-50 dark:bg-purple-950/50"
                  )}
                >
                  <Gavel className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
              <div className="flex items-center text-sm text-primary font-medium group-hover:underline">
                Browse judgments
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Links Section */}
      <div className="border-t pt-8">
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
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted hover:border-primary/30"
    >
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  );
}
