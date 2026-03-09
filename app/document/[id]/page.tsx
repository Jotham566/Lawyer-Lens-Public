"use client";

import { use, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageErrorBoundary } from "@/components/error-boundary";
import {
  FileText,
  ArrowLeft,
  Share2,
  Printer,
  Check,
  ExternalLink,
  List,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useDocument, useDocumentsByType } from "@/lib/hooks";
import { getDocumentPdfUrl } from "@/lib/api";
import { HierarchyRenderer } from "@/components/hierarchy-renderer";
import { TableOfContents } from "@/components/table-of-contents";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { SaveToCollectionButton } from "@/components/collections/save-to-collection-button";
import { useLibraryStore } from "@/lib/stores";
import type { DocumentType, HierarchicalNode } from "@/lib/api/types";
import { formatDateOnly } from "@/lib/utils/date-formatter";

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

function getNodeIdForPath(node: HierarchicalNode): string {
  if (node.akn_eid) return node.akn_eid;
  const type = node.type?.toLowerCase() || "node";
  return `${type}-${node.identifier || "unknown"}`;
}

function findPathToSection(
  node: HierarchicalNode,
  sectionId: string,
  ancestors: HierarchicalNode[] = []
): HierarchicalNode[] | null {
  const currentId = getNodeIdForPath(node);
  if (currentId === sectionId) {
    return [...ancestors, node];
  }
  for (const child of node.children || []) {
    const result = findPathToSection(child, sectionId, [...ancestors, node]);
    if (result) return result;
  }
  return null;
}

function formatPathNode(node: HierarchicalNode): string {
  const type = (node.type || "").toLowerCase();
  const id = node.identifier;
  const title = node.title;
  if (type === "part") return id ? `Part ${id}` : "Part";
  if (type === "chapter") return id ? `Chapter ${id}` : "Chapter";
  if (type === "section") return id ? `Section ${id}` : "Section";
  if (type === "subsection") return id ? `(${id})` : "Subsection";
  if (type === "paragraph") return id ? `(${id})` : "Paragraph";
  if (type === "subparagraph") return id ? `(${id})` : "Subparagraph";
  if (type === "schedule") return id ? `Schedule ${id}` : "Schedule";
  return title || node.type || "Section";
}

function DocumentContent({ id }: { id: string }) {
  const router = useRouter();
  const { data: document, isLoading, error } = useDocument(id);
  const { data: typedDocuments } = useDocumentsByType(document?.document_type || "act", 1, 50);
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = searchParams.get("returnTo");
  const initialSectionId = searchParams.get("section");

  const [copied, setCopied] = useState(false);
  const [hashSectionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash?.replace(/^#/, "").trim();
    return hash ? decodeURIComponent(hash) : null;
  });
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [manualHighlightId, setManualHighlightId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const highlightedSectionId = manualHighlightId ?? hashSectionId ?? initialSectionId;
  const addToHistory = useLibraryStore((s) => s.addToHistory);

  const relatedDocuments = useMemo(() => {
    if (!typedDocuments?.items || !document) return [];
    return typedDocuments.items
      .filter((item) => item.id !== document.id)
      .slice(0, 5);
  }, [typedDocuments, document]);

  const documentIndexInTypeList = useMemo(() => {
    if (!typedDocuments?.items || !document) return -1;
    return typedDocuments.items.findIndex((item) => item.id === document.id);
  }, [typedDocuments, document]);

  const prevDocument = useMemo(() => {
    if (!typedDocuments?.items || documentIndexInTypeList <= 0) return null;
    return typedDocuments.items[documentIndexInTypeList - 1];
  }, [typedDocuments, documentIndexInTypeList]);

  const nextDocument = useMemo(() => {
    if (!typedDocuments?.items || documentIndexInTypeList < 0) return null;
    if (documentIndexInTypeList >= typedDocuments.items.length - 1) return null;
    return typedDocuments.items[documentIndexInTypeList + 1];
  }, [typedDocuments, documentIndexInTypeList]);

  const legalPath = useMemo(() => {
    if (!document?.hierarchical_structure || !activeSectionId) return null;
    const path = findPathToSection(document.hierarchical_structure, activeSectionId);
    if (!path || path.length === 0) return null;
    return path
      .filter((node) => !!node.type)
      .map(formatPathNode)
      .join(" > ");
  }, [document, activeSectionId]);

  const handleBackNavigation = useCallback(() => {
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    if (from === "search") {
      router.push("/search");
      return;
    }

    const hasHistory = window.history.length > 1;
    if (hasHistory) {
      router.back();
      return;
    }
    router.push("/browse");
  }, [router, returnTo, from]);

  // Scroll to highlighted section when document loads and structure is ready
  useEffect(() => {
    if (document && highlightedSectionId) {
      let cancelled = false;

      // Small delay to ensure DOM is rendered
      // Polling mechanism to wait for element to appear
      const checkAndScroll = (attempts = 0) => {
        if (cancelled) return;

        if (attempts > 50) { // Give up after 5 seconds (50 * 100ms)
          return;
        }

        let element = window.document.getElementById(highlightedSectionId);

        // Strategy 1: exact match

        // Strategy 2: Legacy format "section-12"
        if (!element && highlightedSectionId.startsWith("sec_")) {
          const num = highlightedSectionId.replace("sec_", "");
          element = window.document.getElementById(`section-${num}`);
        }

        // Strategy 3: Handle merged IDs (strip suffix) and find best localized parent
        if (!element && highlightedSectionId.includes("__")) {
          let cleanId = highlightedSectionId;
          if (cleanId.endsWith("__merged")) {
            cleanId = cleanId.replace("__merged", "");
          }

          // Try the cleaned exact ID first
          element = window.document.getElementById(cleanId);

          // If not found, try progressively finding the parent container
          // e.g. part_V__sec_9__subsec_5__para_a -> try part_V__sec_9__subsec_5 -> part_V__sec_9
          if (!element) {
            const parts = cleanId.split("__");
            // Try from most specific to least specific
            for (let i = parts.length - 1; i >= 0; i--) {
              const partialId = parts.slice(0, i + 1).join("__");
              element = window.document.getElementById(partialId);

              // Also try legacy format for the primary section part if it's the first one
              if (!element && i === 0 && partialId.startsWith("sec_")) {
                element = window.document.getElementById(`section-${partialId.replace("sec_", "")}`);
              }

              if (element) {
                break;
              }
            }
          }
        }

        // Strategy 4: Fallback to section title search (using data attribute)
        if (!element) {
          const sectionTitleParam = new URLSearchParams(window.location.search).get("sectionTitle");
          if (sectionTitleParam) {
            // Try exact match first
            element = window.document.querySelector(`[data-section-title="${CSS.escape(sectionTitleParam)}"]`) as HTMLElement;

            if (!element) {
              // Try loose matching on title
              const nodes = window.document.querySelectorAll('[data-section-title]');
              for (const node of nodes) {
                const title = node.getAttribute('data-section-title') || '';
                if (title.toLowerCase().includes(sectionTitleParam.toLowerCase()) ||
                  sectionTitleParam.toLowerCase().includes(title.toLowerCase())) {
                  element = node as HTMLElement;
                  break;
                }
              }
            }
          }
        }

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          element.classList.add("section-highlighted");
          setTimeout(() => {
            element?.classList.remove("section-highlighted");
          }, 2000);
        } else {
          // Retry
          if (!cancelled) {
            setTimeout(() => checkAndScroll(attempts + 1), 100);
          }
        }
      };

      checkAndScroll();

      return () => {
        cancelled = true;
      };
    }
  }, [document, highlightedSectionId]);

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
  const embeddedPdfUrl = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`;

  // Generate breadcrumb items based on document type
  const getBreadcrumbItems = () => {
    const docTitle = document.short_title || document.title;
    const truncatedTitle = docTitle.length > 50 ? `${docTitle.slice(0, 50)}...` : docTitle;

    const typeToPath: Record<DocumentType, { label: string; href: string }> = {
      act: { label: "Acts", href: "/browse/acts" },
      judgment: { label: "Case Law", href: "/browse/judgments" },
      regulation: { label: "Regulations", href: "/browse/regulations" },
      constitution: { label: "Constitution", href: "/browse/constitution" },
    };

    const typeInfo = typeToPath[document.document_type] || { label: "Browse", href: "/browse" };

    return [
      { label: "Browse", href: "/browse", isCurrentPage: false },
      { label: typeInfo.label, href: typeInfo.href, isCurrentPage: false },
      { label: truncatedTitle, href: `/document/${id}`, isCurrentPage: true },
    ];
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <a
          href="#document-main-content"
          className="sr-only sr-only-focusable absolute left-4 top-4 z-[60] rounded-md bg-background px-3 py-2 text-sm shadow"
        >
          Skip to document content
        </a>
        {/* Breadcrumb */}
        <div className="border-b px-4 py-3 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs items={getBreadcrumbItems()} />
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
              <Button variant="ghost" size="sm" onClick={handleBackNavigation}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>

              {/* Save to Library */}
              <SaveToCollectionButton
                documentId={document.id}
                itemType="document"
                meta={{
                  title: document.title,
                  short_title: document.short_title,
                  document_type: document.document_type,
                  act_year: document.act_year,
                  chapter: document.chapter,
                }}
                size="sm"
              />
              <Button variant="outline" size="sm" onClick={copyLink} className="hidden sm:inline-flex">
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

              <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:inline-flex">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              {/* Ask about document link */}
              <Button variant="ghost" size="sm" asChild className="ml-auto hidden sm:inline-flex">
                <Link href={`/chat?doc=${encodeURIComponent(document.human_readable_id)}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask about this
                </Link>
              </Button>
            </div>

            {legalPath && (
              <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Current section:</span> {legalPath}
              </div>
            )}

            {(prevDocument || nextDocument) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                {prevDocument ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/document/${prevDocument.id}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous {typeConfig?.label || "Document"}
                    </Link>
                  </Button>
                ) : null}
                {nextDocument ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/document/${nextDocument.id}`}>
                      Next {typeConfig?.label || "Document"}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Content - Format based on document type */}
        <div id="document-main-content" className="flex-1 px-4 py-6 pb-32 md:px-6 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {/* Judgments: Show only PDF */}
            {document.document_type === "judgment" && (
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <div className="text-sm text-muted-foreground">
                      PDF viewer
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reading view
                    </div>
                  </div>
                  <iframe
                    src={embeddedPdfUrl}
                    className="h-[700px] w-full"
                    title={`PDF: ${document.title}`}
                  />
                </CardContent>
              </Card>
            )}

            {/* Acts, Regulations, Constitution: Show rendered AKN content with ToC */}
            {(document.document_type === "act" ||
              document.document_type === "regulation" ||
              document.document_type === "constitution") && (
                <>
                  {/* Sticky Reading Controls */}
                  <div className="z-30 mb-4 rounded-lg border bg-background px-3 py-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">
                      Text size:
                      </span>
                      <div className="flex items-center gap-1">
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

                      <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="lg:hidden">
                            <List className="mr-2 h-4 w-4" />
                            Contents
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[90vw] max-w-sm p-0">
                          <SheetHeader className="px-4 py-3 border-b">
                            <SheetTitle>Table of Contents</SheetTitle>
                            <SheetDescription>
                              Jump to any section in this document.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="p-4">
                            {document.hierarchical_structure && (
                              <TableOfContents
                                node={document.hierarchical_structure}
                                onSectionSelect={(sectionId) => {
                                  setManualHighlightId(sectionId);
                                  setMobileTocOpen(false);
                                }}
                                onActiveSectionChange={setActiveSectionId}
                                className="h-[calc(100vh-140px)] w-full"
                              />
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>

                  {/* Main content with ToC + Reader + Context rail */}
                  <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px]">
                    {/* Table of Contents - sticky sidebar */}
                    {document.hierarchical_structure && (
                      <div className="hidden lg:block sticky top-20 self-start">
                        <TableOfContents
                          node={document.hierarchical_structure}
                          onSectionSelect={setManualHighlightId}
                          onActiveSectionChange={setActiveSectionId}
                          className="shadow-sm"
                        />
                      </div>
                    )}

                    {/* Document content */}
                    <Card className="flex-1 min-w-0">
                      <CardContent className="py-8 px-6 md:px-10">
                        {/* Render hierarchical structure if available */}
                        {document.hierarchical_structure ? (
                          <HierarchyRenderer
                            documentId={document.id}
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
                            highlightedSectionId={highlightedSectionId}
                            showDocumentHeader={false}
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

                    {/* Enterprise context rail */}
                    <aside className="hidden xl:block sticky top-20 self-start space-y-4">
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <h3 className="text-sm font-semibold">Document Trust</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {document.status
                                  ? document.status.replace(/_/g, " ")
                                  : "Published"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Version</span>
                              <span className="font-medium">
                                {document.version_number || "Current"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Jurisdiction</span>
                              <span className="font-medium">
                                {document.jurisdiction || "UG"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <h3 className="text-sm font-semibold">Quick Actions</h3>
                          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                            <Link href={`/chat?doc=${encodeURIComponent(document.human_readable_id)}`}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Ask AI about this document
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>

                      {relatedDocuments.length > 0 && (
                        <Card>
                          <CardContent className="p-4 space-y-2">
                            <h3 className="text-sm font-semibold">
                              Related {typeConfig?.label || "Documents"}
                            </h3>
                            <div className="space-y-1.5">
                              {relatedDocuments.map((item) => (
                                <Link
                                  key={item.id}
                                  href={`/document/${item.id}`}
                                  className="block min-w-0 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
                                >
                                  <p className="line-clamp-2 break-words">
                                    {item.short_title || item.title}
                                  </p>
                                  <p className="break-all text-xs text-muted-foreground">
                                    {item.human_readable_id}
                                  </p>
                                  {item.title && item.title !== item.short_title && (
                                    <p className="break-all text-xs text-muted-foreground/80">
                                      {item.title}
                                    </p>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </aside>
                  </div>
                </>
              )}

            {/* Metadata */}
            <Card className="mt-6">
              <CardContent className="py-4">
                <h3 className="mb-3 font-medium">Document Information</h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2 sm:gap-x-8">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Document ID:</dt>
                    <dd className="font-mono break-all">{document.human_readable_id}</dd>
                  </div>
                  {document.act_number && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Act Number:</dt>
                      <dd>{document.act_number}</dd>
                    </div>
                  )}
                  {document.chapter && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Chapter:</dt>
                      <dd>{document.chapter}</dd>
                    </div>
                  )}
                  {document.case_number && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Case Number:</dt>
                      <dd>{document.case_number}</dd>
                    </div>
                  )}
                  {document.court_level && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Court:</dt>
                      <dd>{document.court_level.replace(/_/g, " ")}</dd>
                    </div>
                  )}
                  {document.publication_date && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">
                        Publication Date:
                      </dt>
                      <dd>
                        {formatDateOnly(document.publication_date)}
                      </dd>
                    </div>
                  )}
                  {document.commencement_date && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">
                        Commencement Date:
                      </dt>
                      <dd>
                        {formatDateOnly(document.commencement_date)}
                      </dd>
                    </div>
                  )}
                  {document.gazette_number && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Gazette Number:</dt>
                      <dd>{document.gazette_number}</dd>
                    </div>
                  )}
                  {document.version_number && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Version:</dt>
                      <dd>
                        {document.version_number}
                        {document.is_latest_version && " (Latest)"}
                      </dd>
                    </div>
                  )}
                  {document.status && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="capitalize">
                        {document.status.replace(/_/g, " ")}
                      </dd>
                    </div>
                  )}
                  {/* Public documents are always published */}
                  {!document.status && (
                    <div className="space-y-1">
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

export default function DocumentPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <PageErrorBoundary fallback="document">
      <Suspense
        fallback={
          <div className="p-4 md:p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        }
      >
        <DocumentContent id={id} />
      </Suspense>
    </PageErrorBoundary>
  );
}
