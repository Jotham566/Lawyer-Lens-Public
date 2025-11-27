"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Share2,
  Printer,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Gavel,
  ScrollText,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { DocumentType, HierarchicalNode } from "@/lib/api/types";

const documentTypeConfig: Record<
  DocumentType,
  { label: string; icon: typeof FileText; className: string }
> = {
  act: { label: "Act", icon: FileText, className: "badge-act" },
  judgment: { label: "Judgment", icon: Gavel, className: "badge-judgment" },
  regulation: {
    label: "Regulation",
    icon: ScrollText,
    className: "badge-regulation",
  },
  constitution: {
    label: "Constitution",
    icon: Scale,
    className: "badge-constitution",
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
        <div className="border-b px-4 py-2 md:px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/browse" className="hover:text-foreground">
              Browse
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/browse/${document.document_type}s`}
              className="hover:text-foreground"
            >
              {typeConfig?.label || document.document_type}s
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="truncate text-foreground">
              {document.human_readable_id}
            </span>
          </nav>
        </div>

        {/* Header */}
        <div className="border-b px-4 py-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                  typeConfig?.className
                    ? typeConfig.className.replace("badge-", "bg-").concat("/20")
                    : "bg-muted"
                )}
              >
                <TypeIcon className="h-6 w-6" />
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
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    AKN XML
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-5xl">
            <Tabs defaultValue="read" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="read">Read</TabsTrigger>
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="xml">XML</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                </TabsList>

                {/* Font Size Controls */}
                <div className="hidden items-center gap-1 md:flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFontSize("small")}
                      >
                        <span
                          className={cn(
                            "text-xs",
                            fontSize === "small" && "font-bold"
                          )}
                        >
                          A
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Small text</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFontSize("medium")}
                      >
                        <span
                          className={cn(
                            "text-sm",
                            fontSize === "medium" && "font-bold"
                          )}
                        >
                          A
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Medium text</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFontSize("large")}
                      >
                        <span
                          className={cn(
                            "text-base",
                            fontSize === "large" && "font-bold"
                          )}
                        >
                          A
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Large text</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Read View */}
              <TabsContent value="read" className="mt-0">
                <Card>
                  <CardContent
                    className={cn(
                      "document-content py-6",
                      fontSize === "small" && "text-sm",
                      fontSize === "medium" && "text-base",
                      fontSize === "large" && "text-lg"
                    )}
                  >
                    {document.hierarchical_structure ? (
                      <HierarchyRenderer
                        node={document.hierarchical_structure}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Document content is not available in structured format.
                        Please view the PDF version.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PDF View */}
              <TabsContent value="pdf" className="mt-0">
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
              </TabsContent>

              {/* JSON View */}
              <TabsContent value="json" className="mt-0">
                <Card>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                      <span className="text-sm text-muted-foreground">
                        JSON Structure
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            JSON.stringify(document, null, 2)
                          )
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <pre className="max-h-[700px] overflow-auto p-4 font-mono text-sm">
                      {JSON.stringify(document, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* XML View */}
              <TabsContent value="xml" className="mt-0">
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                      AKN XML View Coming Soon
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The Akoma Ntoso XML format will be available soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Markdown View */}
              <TabsContent value="markdown" className="mt-0">
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                      Markdown View Coming Soon
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The Markdown format will be available soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version:</dt>
                    <dd>
                      {document.version_number}
                      {document.is_latest_version && " (Latest)"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status:</dt>
                    <dd className="capitalize">
                      {document.status.replace(/_/g, " ")}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface HierarchyRendererProps {
  node: HierarchicalNode;
  depth?: number;
}

function HierarchyRenderer({ node, depth = 0 }: HierarchyRendererProps) {
  const getHeadingComponent = (nodeType: string, currentDepth: number) => {
    const type = nodeType.toLowerCase();

    if (type === "act" || type === "judgment" || type === "document") {
      return "div";
    }
    if (type === "preamble" || type === "part") {
      return currentDepth === 0 ? "h1" : "h2";
    }
    if (type === "chapter") {
      return "h2";
    }
    if (type === "section" || type === "article") {
      return "h3";
    }
    if (type === "subsection" || type === "paragraph") {
      return "h4";
    }
    return "div";
  };

  const Heading = getHeadingComponent(node.type, depth);

  return (
    <div className={cn("space-y-4", depth > 0 && "mt-4")}>
      {(node.title || node.identifier) && (
        <Heading
          id={node.identifier?.toLowerCase().replace(/\s+/g, "-")}
          className={cn(
            "scroll-mt-20",
            Heading === "h1" && "text-2xl font-bold mt-8 mb-4",
            Heading === "h2" && "text-xl font-semibold mt-6 mb-3",
            Heading === "h3" && "text-lg font-semibold mt-4 mb-2",
            Heading === "h4" && "text-base font-medium mt-3 mb-2"
          )}
        >
          {node.identifier && (
            <span className="text-muted-foreground">{node.identifier}. </span>
          )}
          {node.title}
        </Heading>
      )}

      {node.text?.map((paragraph, index) => (
        <p key={index} className="leading-7">
          {paragraph}
        </p>
      ))}

      {node.children?.map((child, index) => (
        <HierarchyRenderer key={index} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
