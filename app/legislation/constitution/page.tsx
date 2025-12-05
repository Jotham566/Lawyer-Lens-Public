"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { searchDocuments } from "@/lib/api";
import type { SearchResult } from "@/lib/api/types";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const constitutionHighlights = [
  {
    chapter: "Chapter 1",
    title: "The Constitution",
    description: "Supremacy and application of the constitution",
  },
  {
    chapter: "Chapter 4",
    title: "Protection of Human Rights",
    description: "Fundamental and other human rights and freedoms",
  },
  {
    chapter: "Chapter 7",
    title: "The Executive",
    description: "The President, Cabinet and Vice President",
  },
  {
    chapter: "Chapter 8",
    title: "The Judiciary",
    description: "Administration of Justice and courts",
  },
  {
    chapter: "Chapter 9",
    title: "Finance",
    description: "Public funds and taxation",
  },
  {
    chapter: "Chapter 15",
    title: "Land and Environment",
    description: "Land ownership and environmental protection",
  },
];

export default function ConstitutionPage() {
  const [constitution, setConstitution] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    searchDocuments({
      q: "Constitution of Uganda 1995",
      document_type: ["constitution"],
      page: 1,
      size: 1,
    })
      .then((response) => {
        if (response.hits.length > 0) {
          setConstitution(response.hits[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load constitution:", err);
        setError("Failed to load constitution");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              The Constitution of Uganda
            </h1>
            <p className="text-muted-foreground">
              The supreme law of the Republic of Uganda, 1995
            </p>
          </div>
        </div>
      </div>

      {/* Main Document Card */}
      {isLoading ? (
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : constitution ? (
        <Card className="mb-8 border-amber-200 dark:border-amber-800 border-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge
                  variant="secondary"
                  className="mb-2 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                >
                  Constitution
                </Badge>
                <CardTitle className="text-xl">{constitution.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The Constitution of the Republic of Uganda, 1995, is the supreme
              law of Uganda. It establishes the structure of government, defines
              fundamental rights and freedoms, and sets out the principles that
              govern the nation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/document/${constitution.document_id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Read Full Text
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/chat?q=What are the fundamental rights in Uganda's Constitution?`}>
                  Ask About Constitution
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Constitution not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The constitution document is not available in the database.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chapter Highlights */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Key Chapters</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {constitutionHighlights.map((item) => (
            <Card
              key={item.chapter}
              className={cn(
                "transition-colors hover:border-amber-300 dark:hover:border-amber-700",
                constitution && "cursor-pointer"
              )}
            >
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-xs">
                  {item.chapter}
                </Badge>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Information Section */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">About the Constitution</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium">History</h3>
            <p className="text-sm text-muted-foreground">
              The Constitution of the Republic of Uganda was promulgated on
              October 8, 1995, replacing the 1967 constitution. It was drafted by
              a Constituent Assembly elected in 1994 and marked Uganda&apos;s
              return to constitutional governance after years of political
              instability.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Amendments</h3>
            <p className="text-sm text-muted-foreground">
              The Constitution has been amended several times since 1995, with
              significant amendments in 2005 and 2017. These amendments have
              modified various provisions including presidential term limits and
              age requirements.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="outline">Enacted: 1995</Badge>
          <Badge variant="outline">Last Amended: 2017</Badge>
          <Badge variant="outline">Chapters: 20</Badge>
          <Badge variant="outline">Articles: 287</Badge>
          <Badge variant="outline">Schedules: 7</Badge>
        </div>
      </div>

      {/* External Resources */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">External Resources</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://ulii.org/akn/ug/act/statute/1995/constitution/eng@1995-10-08"
              target="_blank"
              rel="noopener noreferrer"
            >
              ULII Constitution Page
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.parliament.go.ug/documents/constitution"
              target="_blank"
              rel="noopener noreferrer"
            >
              Parliament of Uganda
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
