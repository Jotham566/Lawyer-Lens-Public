"use client";

import type { ComponentProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type FitMode = "width" | "page";

interface PdfReaderProps {
  fileUrl: string;
  title: string;
  className?: string;
}

type LoadedPdfDocument = Parameters<
  NonNullable<ComponentProps<typeof Document>["onLoadSuccess"]>
>[0];

type LoadedPdfPage = Parameters<
  NonNullable<ComponentProps<typeof Page>["onLoadSuccess"]>
>[0];

function clampPage(value: number, totalPages: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(1, Math.trunc(value)), totalPages);
}

export function PdfReader({ fileUrl, title, className }: PdfReaderProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [draftPage, setDraftPage] = useState("1");
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [zoom, setZoom] = useState(0.5);
  const [manualRotation, setManualRotation] = useState(270);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setDraftPage(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root || !numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const mostVisible = visibleEntries[0];
        if (!mostVisible) return;

        const nextPage = Number((mostVisible.target as HTMLElement).dataset.pageNumber);
        if (Number.isFinite(nextPage)) {
          setPageNumber(nextPage);
        }
      },
      {
        root,
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "-10% 0px -35% 0px",
      }
    );

    pageRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const pageWidth = useMemo(() => {
    if (!containerSize.width) return undefined;
    const horizontalPadding = 48;
    const verticalPadding = 48;
    const availableWidth = Math.max(containerSize.width - horizontalPadding, 280);

    if (fitMode === "width" || !pageSize.width || !pageSize.height || !containerSize.height) {
      return Math.floor(availableWidth * zoom);
    }

    const availableHeight = Math.max(containerSize.height - verticalPadding, 320);
    const aspectRatio = pageSize.width / pageSize.height;
    const fitPageWidth = Math.min(availableWidth, availableHeight * aspectRatio);
    return Math.floor(fitPageWidth * zoom);
  }, [containerSize.height, containerSize.width, fitMode, pageSize.height, pageSize.width, zoom]);

  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const effectiveRotation = manualRotation % 360;

  const updatePage = (nextPage: number) => {
    if (!numPages) return;
    const clampedPage = clampPage(nextPage, numPages);
    const target = pageRefs.current[clampedPage - 1];
    setPageNumber(clampedPage);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDocumentLoad = (pdf: LoadedPdfDocument) => {
    setNumPages(pdf.numPages);
    setPageNumber((current) => clampPage(current, pdf.numPages));
    pageRefs.current = Array.from({ length: pdf.numPages }, (_, index) => pageRefs.current[index] || null);
    setLoadError(null);
  };

  const handlePageLoad = (page: LoadedPdfPage) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageSize({
      width: viewport.width,
      height: viewport.height,
    });
  };

  return (
    <Card className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <CardContent className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="mr-1 hidden min-w-0 lg:block">
            <p className="line-clamp-1 text-xs font-medium text-muted-foreground">{title}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            onClick={() => updatePage(pageNumber - 1)}
            disabled={pageNumber <= 1 || !numPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
            <Input
              value={draftPage}
              onChange={(event) => setDraftPage(event.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => updatePage(Number(draftPage))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  updatePage(Number(draftPage));
                }
              }}
              className="h-7 w-12 border-0 px-0 py-0 text-center text-sm shadow-none focus-visible:ring-0"
              aria-label="Current PDF page"
            />
            <span className="text-sm text-muted-foreground">/ {numPages || "-"}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            onClick={() => updatePage(pageNumber + 1)}
            disabled={!numPages || pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="ml-1 flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Select
              value={zoomLabel}
              onValueChange={(value) => setZoom(Number.parseInt(value, 10) / 100)}
            >
              <SelectTrigger className="h-8 w-[86px] bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["50%", "75%", "100%", "125%", "150%", "200%"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setZoom((value) => Math.min(2.5, Number((value + 0.1).toFixed(2))))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <ToggleGroup
            type="single"
            value={fitMode}
            onValueChange={(value) => {
              if (value === "width" || value === "page") {
                setFitMode(value);
              }
            }}
            className="ml-1 rounded-md border bg-background p-1"
          >
            <ToggleGroupItem value="width" size="sm" className="h-7 px-2 text-xs">
              Fit width
            </ToggleGroupItem>
            <ToggleGroupItem value="page" size="sm" className="h-7 px-2 text-xs">
              Fit page
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            onClick={() => setManualRotation((value) => (value + 90) % 360)}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Rotate
          </Button>
        </div>

      </CardContent>

      <div
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-auto bg-zinc-100 p-6 dark:bg-zinc-950"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={handleDocumentLoad}
          onLoadError={(error) => setLoadError(error.message)}
          loading={
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-[70vh] w-full" />
            </div>
          }
          error={
            <div className="mx-auto max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError || "Unable to load this PDF."}
            </div>
          }
          className="flex min-h-full items-start justify-center"
        >
          <div className="flex w-full flex-col items-center gap-6">
            {Array.from({ length: numPages }, (_, index) => {
              const currentPage = index + 1;
              return (
                <div
                  key={currentPage}
                  ref={(node) => {
                    pageRefs.current[index] = node;
                  }}
                  data-page-number={currentPage}
                  className="flex w-full flex-col items-center gap-2"
                >
                  <div className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                    Page {currentPage}
                  </div>
                  <Page
                    pageNumber={currentPage}
                    width={pageWidth}
                    rotate={effectiveRotation}
                    onLoadSuccess={currentPage === 1 ? handlePageLoad : undefined}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={<Skeleton className="h-[70vh] w-full max-w-3xl" />}
                    className="overflow-hidden rounded-lg border border-border/70 bg-white shadow-2xl dark:border-zinc-800"
                    canvasBackground="white"
                  />
                </div>
              );
            })}
          </div>
        </Document>
      </div>
    </Card>
  );
}
