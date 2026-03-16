"use client";

import { use, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageErrorBoundary } from "@/components/error-boundary";
import {
  FileText,
  ArrowLeft,
  ArrowRight,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAllDocumentsByType, useDocument } from "@/lib/hooks";
import { getDocumentPdfUrl } from "@/lib/api";
import { HierarchyRenderer } from "@/components/hierarchy-renderer";
import { TableOfContents } from "@/components/table-of-contents";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { SaveToCollectionButton } from "@/components/collections/save-to-collection-button";
import { CitationProvider, ResponsiveSourceView } from "@/components/citations";
import { DocumentChatPanel } from "@/components/document-chat";
import { useAuth, useAuthModal } from "@/components/providers";
import { useLibraryStore } from "@/lib/stores";
import type { Document, DocumentType, HierarchicalNode } from "@/lib/api/types";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { resolveDocumentYear } from "@/lib/utils/document-year";
import { useDocumentChat } from "@/hooks/use-document-chat";

const PdfReader = dynamic(
  () => import("@/components/pdf/pdf-reader").then((module) => module.PdfReader),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[calc(100vh-196px)] min-h-[780px] w-full" />,
  }
);

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

function matchesYearBucket(year: number | null, bucket: string) {
  if (!year) return bucket === "all";
  switch (bucket) {
    case "2020s":
      return year >= 2020;
    case "2010s":
      return year >= 2010 && year <= 2019;
    case "2000s":
      return year >= 2000 && year <= 2009;
    case "1990s":
      return year >= 1990 && year <= 1999;
    case "archive":
      return year < 1990;
    default:
      return true;
  }
}

function matchesJudgmentYearRange(year: number | null, range: string) {
  if (!year) return range === "all";
  switch (range) {
    case "2020s":
      return year >= 2020;
    case "2015s":
      return year >= 2015 && year <= 2019;
    case "2010s":
      return year >= 2010 && year <= 2014;
    case "archive":
      return year < 2010;
    default:
      return true;
  }
}

function sortDocumentsForActs(items: Document[], sort: string) {
  return [...items].sort((a, b) => {
    const aYear = Number(resolveDocumentYear(a) || 0);
    const bYear = Number(resolveDocumentYear(b) || 0);
    const titleCompare = a.title.localeCompare(b.title);

    switch (sort) {
      case "title_desc":
        return b.title.localeCompare(a.title);
      case "year_desc":
        return bYear - aYear || titleCompare;
      case "year_asc":
        return aYear - bYear || titleCompare;
      default:
        return titleCompare;
    }
  });
}

function sortDocumentsForJudgments(items: Document[], sort: string) {
  return [...items].sort((a, b) => {
    const aDate = a.publication_date ? new Date(a.publication_date).getTime() : 0;
    const bDate = b.publication_date ? new Date(b.publication_date).getTime() : 0;
    const titleCompare = a.title.localeCompare(b.title);

    switch (sort) {
      case "date_asc":
        return aDate - bDate || titleCompare;
      case "title_asc":
        return titleCompare;
      case "title_desc":
        return b.title.localeCompare(a.title);
      default:
        return bDate - aDate || titleCompare;
    }
  });
}

function getCollectionInfo(documentType: DocumentType) {
  switch (documentType) {
    case "act":
      return {
        rootLabel: "Legislation",
        rootHref: "/legislation",
        collectionLabel: "Acts",
        collectionHref: "/legislation/acts",
      };
    case "regulation":
      return {
        rootLabel: "Legislation",
        rootHref: "/legislation",
        collectionLabel: "Regulations",
        collectionHref: "/legislation/regulations",
      };
    case "constitution":
      return {
        rootLabel: "Legislation",
        rootHref: "/legislation",
        collectionLabel: "Constitution",
        collectionHref: "/legislation/constitution",
      };
    case "judgment":
      return {
        rootLabel: "Case Law",
        rootHref: "/judgments",
        collectionLabel: "Judgments",
        collectionHref: "/judgments",
      };
    default:
      return {
        rootLabel: "Browse",
        rootHref: "/browse",
        collectionLabel: "Documents",
        collectionHref: "/browse",
      };
  }
}

function DocumentContent({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { data: document, isLoading, error } = useDocument(id);
  const { data: typedDocuments } = useAllDocumentsByType(document?.document_type || "act");
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = searchParams.get("returnTo");
  const initialSectionId = searchParams.get("section");

  const [copied, setCopied] = useState(false);
  const [isDesktopDocumentChat, setIsDesktopDocumentChat] = useState(false);
  const [hasInitializedDocumentChat, setHasInitializedDocumentChat] = useState(false);
  const [desktopChatWidth, setDesktopChatWidth] = useState(0);
  const [isResizingDocumentChat, setIsResizingDocumentChat] = useState(false);
  const [hashSectionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash?.replace(/^#/, "").trim();
    return hash ? decodeURIComponent(hash) : null;
  });
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [documentChatOpen, setDocumentChatOpen] = useState(false);
  const [manualHighlightId, setManualHighlightId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const highlightedSectionId = manualHighlightId ?? hashSectionId ?? initialSectionId;
  const documentChat = useDocumentChat(document ?? null);
  const addToHistory = useLibraryStore((s) => s.addToHistory);
  const collectionInfo = document ? getCollectionInfo(document.document_type) : null;

  const clampDesktopChatWidth = useCallback((value: number) => {
    if (typeof window === "undefined") return value;
    const minWidth = 360;
    const maxWidth = Math.min(Math.floor(window.innerWidth * 0.55), 760);
    return Math.min(Math.max(value, minWidth), maxWidth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncDesktopState = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : mediaQuery.matches;
      setIsDesktopDocumentChat(matches);
      if (!hasInitializedDocumentChat) {
        setDocumentChatOpen(matches);
        setDesktopChatWidth(clampDesktopChatWidth(window.innerWidth * 0.4));
        setHasInitializedDocumentChat(true);
      } else if (matches) {
        setDesktopChatWidth((current) =>
          current > 0 ? clampDesktopChatWidth(current) : clampDesktopChatWidth(window.innerWidth * 0.4)
        );
      }
    };

    syncDesktopState();
    mediaQuery.addEventListener("change", syncDesktopState);
    return () => mediaQuery.removeEventListener("change", syncDesktopState);
  }, [clampDesktopChatWidth, hasInitializedDocumentChat]);

  useEffect(() => {
    if (!isDesktopDocumentChat || !isResizingDocumentChat) return;

    const handlePointerMove = (event: PointerEvent) => {
      setDesktopChatWidth(clampDesktopChatWidth(window.innerWidth - event.clientX));
    };

    const handlePointerUp = () => {
      setIsResizingDocumentChat(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.document.body.style.cursor = "col-resize";
    window.document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.document.body.style.cursor = "";
      window.document.body.style.userSelect = "";
    };
  }, [clampDesktopChatWidth, isDesktopDocumentChat, isResizingDocumentChat]);

  const contextualDocuments = useMemo(() => {
    if (!typedDocuments || !document) return [];

    if (document.document_type === "judgment" && returnTo?.startsWith("/judgments/")) {
      const target = returnTo.startsWith("http")
        ? new URL(returnTo)
        : new URL(returnTo, "http://localhost");
      const pathParts = target.pathname.split("/").filter(Boolean);
      const courtId = pathParts[1];
      const params = target.searchParams;
      const year = params.get("year") || "all";
      const query = (params.get("q") || "").trim().toLowerCase();
      const sort = params.get("sort") || "date_desc";

      const filtered = typedDocuments.filter((item) => {
        const searchable = [
          item.title,
          item.case_number,
          item.human_readable_id,
          item.court_level,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const judgmentYear = item.publication_date
          ? new Date(item.publication_date).getFullYear()
          : null;

        if (courtId && item.court_level !== courtId) {
          return false;
        }

        if (year !== "all" && !matchesJudgmentYearRange(judgmentYear, year)) {
          return false;
        }

        if (query && !searchable.includes(query)) {
          return false;
        }

        return true;
      });

      return sortDocumentsForJudgments(filtered, sort);
    }

    if (document.document_type !== "act" || !returnTo?.startsWith("/legislation/acts")) {
      return typedDocuments;
    }

    const target = returnTo.startsWith("http")
      ? new URL(returnTo)
      : new URL(returnTo, "http://localhost");
    const params = target.searchParams;
    const letter = params.get("letter") || "";
    const year = params.get("year") || "all";
    const query = (params.get("q") || "").trim().toLowerCase();
    const sort = params.get("sort") || "title_asc";

    const filtered = typedDocuments.filter((item) => {
      const title = item.title.toUpperCase();
      const displayYear = Number(resolveDocumentYear(item) || 0) || null;
      const searchable = [
        item.title,
        item.short_title,
        item.chapter,
        item.act_number ? `Act No. ${item.act_number}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (letter && !title.startsWith(letter)) {
        return false;
      }

      if (year !== "all" && !matchesYearBucket(displayYear, year)) {
        return false;
      }

      if (query && !searchable.includes(query)) {
        return false;
      }

      return true;
    });

    return sortDocumentsForActs(filtered, sort);
  }, [typedDocuments, document, returnTo]);

  const relatedDocuments = useMemo(() => {
    if (!contextualDocuments.length || !document) return [];
    return contextualDocuments
      .filter((item) => item.id !== document.id)
      .slice(0, 5);
  }, [contextualDocuments, document]);

  const showRelatedDocumentsRail =
    relatedDocuments.length > 0 &&
    !(document?.document_type === "act" && documentChatOpen);

  const documentIndexInTypeList = useMemo(() => {
    if (!contextualDocuments.length || !document) return -1;
    return contextualDocuments.findIndex((item) => item.id === document.id);
  }, [contextualDocuments, document]);

  const prevDocument = useMemo(() => {
    if (!contextualDocuments.length || documentIndexInTypeList <= 0) return null;
    return contextualDocuments[documentIndexInTypeList - 1];
  }, [contextualDocuments, documentIndexInTypeList]);

  const nextDocument = useMemo(() => {
    if (!contextualDocuments.length || documentIndexInTypeList < 0) return null;
    if (documentIndexInTypeList >= contextualDocuments.length - 1) return null;
    return contextualDocuments[documentIndexInTypeList + 1];
  }, [contextualDocuments, documentIndexInTypeList]);

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
    router.push(collectionInfo?.collectionHref || "/browse");
  }, [router, returnTo, from, collectionInfo]);

  const handleOpenDocumentChat = useCallback(() => {
    if (!isAuthenticated) {
      openLogin(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
      return;
    }
    setDocumentChatOpen(true);
  }, [isAuthenticated, openLogin, pathname, searchParams]);

  const handleSelectChatCitation = useCallback((sectionId?: string | null) => {
    if (!sectionId) return;
    setManualHighlightId(sectionId);
    setActiveSectionId(sectionId);
    setTimeout(() => {
      const element = window.document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  }, []);

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
  const pdfUrl = getDocumentPdfUrl(id);
  const browseBackLabel = document.document_type === "act"
    ? "Back to Acts"
    : `Back to ${collectionInfo?.collectionLabel || "Documents"}`;
  const buildDocumentHref = (documentId: string) =>
    `/document/${documentId}${
      returnTo
        ? `?returnTo=${encodeURIComponent(returnTo)}${from ? `&from=${encodeURIComponent(from)}` : ""}`
        : from
          ? `?from=${encodeURIComponent(from)}`
          : ""
    }`;

  // Generate breadcrumb items based on document type
  const getBreadcrumbItems = () => {
    const docTitle = document.short_title || document.title;
    const truncatedTitle = docTitle.length > 50 ? `${docTitle.slice(0, 50)}...` : docTitle;
    const typeInfo = getCollectionInfo(document.document_type);

    return [
      { label: typeInfo.rootLabel, href: typeInfo.rootHref, isCurrentPage: false },
      {
        label: typeInfo.collectionLabel,
        href: returnTo || typeInfo.collectionHref,
        isCurrentPage: false,
      },
      { label: truncatedTitle, href: `/document/${id}`, isCurrentPage: true },
    ];
  };

  const activeDesktopChatWidth = desktopChatWidth || 440;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col",
        )}
        style={
          documentChatOpen && isDesktopDocumentChat
            ? { paddingRight: `${activeDesktopChatWidth}px` }
            : undefined
        }
      >
        <a
          href="#document-main-content"
          className="sr-only sr-only-focusable absolute left-4 top-4 z-[60] rounded-md bg-background px-3 py-2 text-sm shadow"
        >
          Skip to document content
        </a>
        <div
          className={cn(
            "bg-background",
            document.document_type !== "judgment" &&
              "sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
          )}
        >
          {/* Breadcrumb */}
          <div className="px-4 py-1.5 md:px-6">
            <div className="mx-auto max-w-5xl">
              <Breadcrumbs items={getBreadcrumbItems()} />
            </div>
          </div>

          {/* Header */}
          <div className={cn("px-4 py-2 md:px-6", document.document_type === "judgment" && "border-t")}>
            <div className="mx-auto max-w-5xl">
            {document.document_type === "judgment" ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleBackNavigation}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {browseBackLabel}
                    </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyLink}
                      className="hidden sm:inline-flex"
                    >
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
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Card className="border-border/70 bg-muted/20">
                      <CardContent className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight">
                            {documentIndexInTypeList >= 0 && contextualDocuments.length > 0
                              ? `${documentIndexInTypeList + 1} of ${contextualDocuments.length} in this view`
                              : `Browse ${collectionInfo?.collectionLabel?.toLowerCase() || "documents"}`}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8" asChild>
                          <Link href={returnTo || collectionInfo?.collectionHref || "/browse"}>
                            {collectionInfo?.collectionLabel || "Browse"}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                    <Button variant="ghost" size="sm" onClick={handleOpenDocumentChat}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ask this document
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleBackNavigation}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {browseBackLabel}
                      </Button>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyLink}
                        className="hidden sm:inline-flex"
                      >
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="hidden sm:inline-flex"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                      <Button variant="ghost" size="sm" onClick={handleOpenDocumentChat}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ask this document
                      </Button>
                      {prevDocument ? (
                        <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
                          <Link href={buildDocumentHref(prevDocument.id)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous {typeConfig?.label || "Document"}
                          </Link>
                        </Button>
                      ) : null}
                      {nextDocument ? (
                        <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
                          <Link href={buildDocumentHref(nextDocument.id)}>
                            Next {typeConfig?.label || "Document"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-0.5 min-w-0">
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
                    {document.act_number && (
                      <Badge variant="outline">Act No. {document.act_number}</Badge>
                    )}
                  </div>
                  <h1 className="mt-0.5 text-[1.35rem] font-semibold leading-tight">
                    {document.title}
                  </h1>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground md:text-xs">
                    <span className="rounded-full border bg-muted/30 px-3 py-1">
                      {document.human_readable_id}
                    </span>
                    {document.publication_date && (
                      <span className="rounded-full border bg-muted/30 px-3 py-1">
                        Published {formatDateOnly(document.publication_date)}
                      </span>
                    )}
                    {document.commencement_date && (
                      <span className="rounded-full border bg-muted/30 px-3 py-1">
                        Commenced {formatDateOnly(document.commencement_date)}
                      </span>
                    )}
                    {legalPath && (
                      <span className="rounded-full border bg-muted/30 px-3 py-1">
                        {legalPath}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {legalPath && document.document_type === "judgment" && (
              <div className="mt-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Current section:</span> {legalPath}
              </div>
            )}

            </div>
          </div>
        </div>

        {/* Content - Format based on document type */}
        <div id="document-main-content" className="flex-1 px-4 py-2 pb-28 md:px-6 md:pb-4">
          <div
            className={cn(
              "mx-auto",
              documentChatOpen
                ? "max-w-none"
                : "max-w-7xl"
            )}
          >
            {/* Judgments: Show only PDF */}
            {document.document_type === "judgment" && (
              <div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn(typeConfig?.className)}>
                            {typeConfig?.label || document.document_type}
                          </Badge>
                          {document.publication_date && (
                            <Badge variant="outline">
                              {new Date(document.publication_date).getFullYear()}
                            </Badge>
                          )}
                        </div>
                        <h1 className="mt-0.5 text-[1.25rem] font-semibold leading-tight">
                          {document.title}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          {document.case_number && (
                            <span className="rounded-full border bg-muted/30 px-2.5 py-0.5">
                              {document.case_number}
                            </span>
                          )}
                          <span className="rounded-full border bg-muted/30 px-2.5 py-0.5">
                            {document.human_readable_id}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {prevDocument ? (
                          <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
                            <Link href={buildDocumentHref(prevDocument.id)}>
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Previous
                            </Link>
                          </Button>
                        ) : null}
                        {nextDocument ? (
                          <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
                            <Link href={buildDocumentHref(nextDocument.id)}>
                              Next
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        ) : null}
                        {document.court_level && (
                          <Badge variant="outline">{document.court_level.replace(/_/g, " ")}</Badge>
                        )}
                        {document.publication_date && (
                          <Badge variant="outline">{formatDateOnly(document.publication_date)}</Badge>
                        )}
                      </div>
                    </div>
                    <PdfReader
                      fileUrl={pdfUrl}
                      title={document.title}
                      className="h-[calc(100vh-196px)] min-h-[780px] border-0 shadow-none"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Acts, Regulations, Constitution: Show rendered AKN content with ToC */}
            {(document.document_type === "act" ||
              document.document_type === "regulation" ||
              document.document_type === "constitution") && (
                <>
                  <div className="mb-3 flex justify-end lg:hidden">
                    <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <List className="mr-2 h-4 w-4" />
                          Contents
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[90vw] max-w-sm p-0">
                        <SheetHeader className="border-b px-4 py-3">
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

                  {/* Main content with ToC + Reader + Context rail */}
                  <div
                    className={cn(
                      "grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]",
                      showRelatedDocumentsRail && "xl:grid-cols-[260px_minmax(0,1fr)_240px]"
                    )}
                  >
                    {/* Table of Contents - sticky sidebar */}
                    {document.hierarchical_structure && (
                      <div className="hidden lg:block sticky top-[148px] self-start">
                        <TableOfContents
                          node={document.hierarchical_structure}
                          onSectionSelect={setManualHighlightId}
                          onActiveSectionChange={setActiveSectionId}
                          className="max-h-[calc(100vh-164px)] overflow-y-auto shadow-sm"
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
                            fontSize="medium"
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

                    {/* Related documents rail */}
                    {showRelatedDocumentsRail && (
                      <aside className="hidden xl:block sticky top-[148px] self-start">
                        <Card>
                          <CardContent className="max-h-[calc(100vh-164px)] overflow-y-auto p-4 space-y-2">
                            <h3 className="text-sm font-semibold">
                              Related {typeConfig?.label || "Documents"}
                            </h3>
                            <div className="space-y-1.5">
                              {relatedDocuments.map((item) => (
                                <Link
                                  key={item.id}
                                  href={buildDocumentHref(item.id)}
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
                      </aside>
                    )}
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

        <CitationProvider>
          <div className="hidden xl:block">
            <aside
              className={cn(
                "fixed bottom-0 right-0 top-20 z-40 transition-[width,transform,opacity] duration-200",
                documentChatOpen
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-8 opacity-0"
              )}
              style={{ width: `${activeDesktopChatWidth}px` }}
            >
              {document && (
                <div className="relative h-full">
                  <button
                    type="button"
                    aria-label="Resize document chat panel"
                    onPointerDown={() => setIsResizingDocumentChat(true)}
                    className="absolute bottom-0 left-0 top-0 z-50 flex w-3 -translate-x-1/2 cursor-col-resize items-center justify-center"
                  >
                    <span
                      className={cn(
                        "h-20 w-1 rounded-full bg-border/80 transition-colors",
                        isResizingDocumentChat && "bg-primary"
                      )}
                    />
                  </button>
                  <DocumentChatPanel
                    document={document}
                    input={documentChat.input}
                    messages={documentChat.messages}
                    conversationId={documentChat.conversationId}
                    isLoading={documentChat.isLoading}
                    isGenerating={documentChat.isGenerating}
                    error={documentChat.error}
                    starterPrompts={documentChat.starterPrompts}
                    onInputChange={documentChat.setInput}
                    onSend={documentChat.sendMessage}
                    onStop={documentChat.stop}
                    onSelectCitation={(citation) =>
                      handleSelectChatCitation(citation.section_id || citation.chunk_id || null)
                    }
                    onSelectFollowup={(question) => void documentChat.sendMessage(question)}
                    onClose={() => setDocumentChatOpen(false)}
                    className="h-[calc(100vh-5rem)] rounded-none border-y-0 border-r-0 shadow-xl"
                  />
                </div>
              )}
            </aside>
          </div>

          {!isDesktopDocumentChat && (
            <Sheet open={documentChatOpen} onOpenChange={setDocumentChatOpen}>
              <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
                <SheetHeader className="sr-only">
                  <SheetTitle>
                    {document ? `Ask AI about ${document.title}` : "Ask AI about this document"}
                  </SheetTitle>
                  <SheetDescription>
                    Chat with the current document while staying on the document page.
                  </SheetDescription>
                </SheetHeader>
                {document && (
                  <DocumentChatPanel
                    document={document}
                    input={documentChat.input}
                    messages={documentChat.messages}
                    conversationId={documentChat.conversationId}
                    isLoading={documentChat.isLoading}
                    isGenerating={documentChat.isGenerating}
                    error={documentChat.error}
                    starterPrompts={documentChat.starterPrompts}
                    onInputChange={documentChat.setInput}
                    onSend={documentChat.sendMessage}
                    onStop={documentChat.stop}
                    onSelectCitation={(citation) =>
                      handleSelectChatCitation(citation.section_id || citation.chunk_id || null)
                    }
                    onSelectFollowup={(question) => void documentChat.sendMessage(question)}
                    onClose={() => setDocumentChatOpen(false)}
                    className="h-full rounded-none border-0"
                  />
                )}
              </SheetContent>
            </Sheet>
          )}
          <ResponsiveSourceView />
        </CitationProvider>
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
