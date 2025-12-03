"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Share2,
  Printer,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Gavel,
  ScrollText,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDocument } from "@/lib/hooks";
import { getDocumentPdfUrl } from "@/lib/api";
import { HierarchyRenderer } from "@/components/hierarchy-renderer";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { SaveButton } from "@/components/library/save-button";
import { useLibraryStore } from "@/lib/stores";
import type { DocumentType } from "@/lib/api/types";

const documentTypeConfig: Record<
  DocumentType,
  { label: string; icon: typeof FileText; className: string; color: string; bgColor: string }
> = {
  act: {
    label: "Act",
    icon: FileText,
    className: "badge-act",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  judgment: {
    label: "Judgment",
    icon: Gavel,
    className: "badge-judgment",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  regulation: {
    label: "Regulation",
    icon: ScrollText,
    className: "badge-regulation",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  constitution: {
    label: "Constitution",
    icon: BookOpen,
    className: "badge-constitution",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: document, isLoading, error } = useDocument(id);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const addToHistory = useLibraryStore((s) => s.addToHistory);

  // Add to reading history when document loads
  useEffect(() => {
    if (document) {
      addToHistory({
        documentId: document.id,
        humanReadableId: document.human_readable_id,
        title: document.title,
        documentType: document.document_type,
      });
    }
  }, [document, addToHistory]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="border-destructive">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Document not found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The document you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button asChild className="mt-4">
                <Link href="/browse">Browse Documents</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const typeConfig = documentTypeConfig[document.document_type];
  const TypeIcon = typeConfig?.icon || FileText;
  const pdfUrl = getDocumentPdfUrl(id);

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        {/* Breadcrumb */}
        <div className="border-b px-4 py-3 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs />
          </div>
        </div>

        {/* Header */}
        <div className="border-b px-4 py-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  typeConfig?.bgColor || "bg-muted"
                )}
              >
                <TypeIcon className={cn("h-6 w-6", typeConfig?.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn(typeConfig?.className)}>
                    {typeConfig?.label || document.document_type}
                  </Badge>
                  {document.act_year && (
                    <Badge variant="outline">{document.act_year}</Badge>
                  )}
                  {document.chapter && (
                    <Badge variant="outline">Chapter {document.chapter}</Badge>
                  )}
                </div>
                <h1 className="mt-2 text-xl font-semibold leading-tight md:text-2xl">
                  {document.title}
                </h1>
                {document.short_title && document.short_title !== document.title && (
                  <p className="mt-1 text-muted-foreground">
                    {document.short_title}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Save to Library */}
              <SaveButton
                document={{
                  id: document.id,
                  humanReadableId: document.human_readable_id,
                  title: document.title,
                  documentType: document.document_type,
                  shortTitle: document.short_title,
                  actYear: document.act_year,
                  caseNumber: document.case_number,
                  courtLevel: document.court_level,
                  publicationDate: document.publication_date,
                }}
                size="sm"
              />
              {/* Judgments: PDF download only */}
              {document.document_type === "judgment" && (
                <Button variant="outline" size="sm" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              )}

              {/* Acts/Regulations/Constitution: Multiple format downloads */}
              {(document.document_type === "act" ||
                document.document_type === "regulation" ||
                document.document_type === "constitution") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      AKN XML (coming soon)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              {/* Ask AI link */}
              <Button variant="ghost" size="sm" asChild className="ml-auto">
                <Link href={`/chat?doc=${encodeURIComponent(document.human_readable_id)}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask AI about this
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Format based on document type */}
        <div className="flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-5xl">
            {/* Judgments: Show only PDF */}
            {document.document_type === "judgment" && (
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        100%
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in new tab
                      </a>
                    </Button>
                  </div>
                  <iframe
                    src={pdfUrl}
                    className="h-[700px] w-full"
                    title={`PDF: ${document.title}`}
                  />
                </CardContent>
              </Card>
            )}

            {/* Acts, Regulations, Constitution: Show rendered AKN content */}
            {(document.document_type === "act" ||
              document.document_type === "regulation" ||
              document.document_type === "constitution") && (
              <>
                {/* Font Size Controls */}
                <div className="mb-4 flex items-center justify-end gap-1">
                  <span className="mr-2 text-sm text-muted-foreground">
                    Text size:
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={fontSize === "small" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFontSize("small")}
                      >
                        <span className="text-xs">A</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Small text</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={fontSize === "medium" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFontSize("medium")}
                      >
                        <span className="text-sm">A</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Medium text</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={fontSize === "large" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFontSize("large")}
                      >
                        <span className="text-base">A</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Large text</TooltipContent>
                  </Tooltip>
                </div>

                <Card>
                  <CardContent className="py-6">
                    {/* Render hierarchical structure if available */}
                    {document.hierarchical_structure ? (
                      <HierarchyRenderer
                        node={document.hierarchical_structure}
                        document={{
                          title: document.title,
                          short_title: document.short_title,
                          jurisdiction: document.jurisdiction,
                          act_year: document.act_year,
                          chapter: document.chapter,
                          publication_date: document.publication_date,
                          commencement_date: document.commencement_date,
                        }}
                        fontSize={fontSize}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">
                          Document content is not available in structured format.
                        </p>
                        <Button className="mt-4" asChild>
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View PDF instead
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Metadata */}
            <Card className="mt-6">
              <CardContent className="py-4">
                <h3 className="mb-3 font-medium">Document Information</h3>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Document ID:</dt>
                    <dd className="font-mono">{document.human_readable_id}</dd>
                  </div>
                  {document.act_number && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Act Number:</dt>
                      <dd>{document.act_number}</dd>
                    </div>
                  )}
                  {document.chapter && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Chapter:</dt>
                      <dd>{document.chapter}</dd>
                    </div>
                  )}
                  {document.case_number && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Case Number:</dt>
                      <dd>{document.case_number}</dd>
                    </div>
                  )}
                  {document.court_level && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Court:</dt>
                      <dd>{document.court_level.replace(/_/g, " ")}</dd>
                    </div>
                  )}
                  {document.publication_date && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        Publication Date:
                      </dt>
                      <dd>
                        {new Date(document.publication_date).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {document.commencement_date && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        Commencement Date:
                      </dt>
                      <dd>
                        {new Date(
                          document.commencement_date
                        ).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {document.gazette_number && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Gazette Number:</dt>
                      <dd>{document.gazette_number}</dd>
                    </div>
                  )}
                  {document.version_number && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Version:</dt>
                      <dd>
                        {document.version_number}
                        {document.is_latest_version && " (Latest)"}
                      </dd>
                    </div>
                  )}
                  {document.status && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="capitalize">
                        {document.status.replace(/_/g, " ")}
                      </dd>
                    </div>
                  )}
                  {/* Public documents are always published */}
                  {!document.status && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="capitalize text-green-600">Published</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

