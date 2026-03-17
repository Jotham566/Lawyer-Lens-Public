"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageErrorBoundary } from "@/components/error-boundary";
import {
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  ChevronRight,
  Download,
  BookOpen,
  Clock,
  Sparkles,
  Plus,
  LayoutPanelLeft,
  WifiOff,
  RefreshCcw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { APIError } from "@/lib/api/client";
import {
  createResearchSession,
  getResearchSession,
  submitClarifyingAnswers,
  approveResearchBrief,
  saveResearchBrief,
  getResearchReport,
  saveResearchReport,
  resumeResearchSession,
  streamResearchProgress,
  type ResearchSession,
  type ResearchReport,
  type ResearchGraphCheckpoint,
  type ClarifyAnswers,
  type StreamProgress,
  type ApproveBriefRequest,
} from "@/lib/api";
import { useResearchSessionsStore } from "@/lib/stores";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { useRequireAuth } from "@/components/providers";
import { EditableDocumentCanvas } from "@/components/canvas/editable-document-canvas";
import { RichTextToolbar } from "@/components/canvas/rich-text-toolbar";
import { useEntitlements } from "@/hooks/use-entitlements";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { useOnlineStatus } from "@/lib/hooks";
import { exportResearchReportToWord } from "@/lib/utils/word-export";
import { ensureRichHtml, richHtmlToPlainText, sanitizeRichHtml } from "@/lib/utils/rich-text";

// Map backend status values to UI labels
const statusLabels: Record<string, { label: string; description: string }> = {
  clarifying: {
    label: "Clarification",
    description: "Help us understand your research needs",
  },
  brief_review: {
    label: "Review Brief",
    description: "Review and approve research plan",
  },
  researching: {
    label: "Researching",
    description: "Searching and analyzing legal sources",
  },
  writing: {
    label: "Writing",
    description: "Creating your comprehensive report",
  },
  complete: {
    label: "Complete",
    description: "Your research report is ready",
  },
  error: {
    label: "Failed",
    description: "An error occurred during research",
  },
};

const ACTIVE_RESEARCH_SESSION_KEY = "law-lens-active-research-session";
const researchReportDraftKey = (sessionId: string) => `law-lens-research-report-draft:${sessionId}`;
const BRIEF_AUTOSAVE_DEBOUNCE_MS = 1800;
const REPORT_AUTOSAVE_DEBOUNCE_MS = 2500;
const RATE_LIMIT_BACKOFF_MS = 10000;

function getCitationMeta(citation: ResearchReport["citations"][number]): string {
  return [citation.legal_reference, citation.case_citation, citation.court].filter(Boolean).join(" · ");
}

function buildInlineCitationHtml(
  report: ResearchReport,
  citationIds: string[],
  citationIndexLookup: Map<string, number>,
): string {
  return citationIds
    .map((citationId) => {
      const citation = report.citations.find((item) => item.id === citationId);
      const citationNumber = citationIndexLookup.get(citationId);
      if (!citation || !citationNumber) return "";

      const meta = getCitationMeta(citation);
      const preferredUrl = citation.document_url || citation.external_url;

      return `
        <span data-inline-citations="true" contenteditable="false" class="group relative mx-1 inline-flex align-baseline">
          ${
            preferredUrl
              ? `<a href="${preferredUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex cursor-pointer items-center rounded-full border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-sans font-semibold text-sky-900 no-underline shadow-sm transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-950/60">[${citationNumber}]</a>`
              : `<span class="inline-flex cursor-default items-center rounded-full border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-sans font-semibold text-sky-900 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">[${citationNumber}]</span>`
          }
          <span class="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-[340px] max-w-[80vw] rounded-2xl border border-black/10 bg-white/98 p-3 opacity-0 shadow-[0_18px_48px_-22px_rgba(15,23,42,0.35)] transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-white/10 dark:bg-[#12161f]">
            <span class="flex items-start gap-3">
              <span class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-800 dark:bg-sky-950/50 dark:text-sky-100">[${citationNumber}]</span>
              <span class="min-w-0">
                ${
                  preferredUrl
                    ? `<a href="${preferredUrl}" target="_blank" rel="noopener noreferrer" class="pointer-events-auto text-sm font-semibold text-primary hover:underline">${citation.title}</a>`
                    : `<span class="text-sm font-semibold text-foreground">${citation.title}</span>`
                }
                ${meta ? `<span class="mt-1 block text-xs text-muted-foreground">${meta}</span>` : ""}
                ${
                  preferredUrl
                    ? `<a href="${preferredUrl}" target="_blank" rel="noopener noreferrer" class="pointer-events-auto mt-2 inline-flex text-xs font-medium text-primary hover:underline">Open source in new tab</a>`
                    : ""
                }
              </span>
            </span>
          </span>
        </span>
      `;
    })
    .join(" ");
}

function injectInlineCitations(bodyHtml: string, inlineCitationHtml: string): string {
  if (!inlineCitationHtml.trim()) return bodyHtml;

  if (bodyHtml.includes("</p>")) {
    const lastParagraphIndex = bodyHtml.lastIndexOf("</p>");
    return `${bodyHtml.slice(0, lastParagraphIndex)} ${inlineCitationHtml}${bodyHtml.slice(lastParagraphIndex)}`;
  }

  return `${bodyHtml}<p>${inlineCitationHtml}</p>`;
}

function buildFallbackCitation(
  id: string,
  title: string,
  href: string,
): ResearchReport["citations"][number] {
  return {
    id,
    source_type: "web",
    title,
    external_url: href,
    document_url: href,
    relevance_score: 0.5,
  };
}

function stripSourceUrlsFromHtml(html: string): string {
  if (typeof window === "undefined" || !html.trim()) {
    return html;
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return html;

  const urlPattern = /\bhttps?:\/\/[^\s<>()]+/gi;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parentTag = node.parentElement?.tagName;
    if (parentTag && ["A", "SUMMARY"].includes(parentTag)) {
      continue;
    }
    textNodes.push(node);
  }

  for (const node of textNodes) {
    const original = node.textContent || "";
    const cleaned = original.replace(urlPattern, "").replace(/\s{2,}/g, " ").trim();
    if (cleaned !== original.trim()) {
      node.textContent = cleaned;
    }
  }

  root.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href")?.trim() || "";
    const text = anchor.textContent?.trim() || "";
    if (href && (text === href || text.replace(/\/$/, "") === href.replace(/\/$/, ""))) {
      const container = anchor.closest("p, li, blockquote, div");
      anchor.remove();
      if (container && !container.textContent?.trim() && container.children.length === 0) {
        container.remove();
      }
    }
  });

  root.querySelectorAll("p, li, blockquote, div").forEach((element) => {
    if (!element.textContent?.trim() && element.children.length === 0) {
      element.remove();
    }
  });

  return sanitizeRichHtml(root.innerHTML);
}

function stripCitationIdArtifactsFromHtml(html: string): string {
  if (typeof window === "undefined" || !html.trim()) {
    return html;
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return html;

  const artifactPattern = /\[(?:[a-f0-9]{6,8})(?:,\s*[a-f0-9]{6,8})*\]|\[\s*Sources?\s*:\s*[a-f0-9]{6,8}(?:\s*,\s*[a-f0-9]{6,8})*\s*\]|Citation IDs\s*:\s*[a-f0-9]{6,8}(?:\s*,\s*[a-f0-9]{6,8})*/gi;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parentTag = node.parentElement?.tagName;
    if (parentTag && ["A", "SUMMARY"].includes(parentTag)) {
      continue;
    }
    textNodes.push(node);
  }

  for (const node of textNodes) {
    const original = node.textContent || "";
    const cleaned = original.replace(artifactPattern, "").replace(/\s{2,}/g, " ");
    if (cleaned !== original) {
      node.textContent = cleaned.trim();
    }
  }

  return sanitizeRichHtml(root.innerHTML);
}

function extractFallbackCitationsFromHtml(
  html: string,
  citations: ResearchReport["citations"],
  citationByHref: Map<string, ResearchReport["citations"][number]>,
): { cleanedHtml: string; citationIds: string[] } {
  if (typeof window === "undefined") {
    return { cleanedHtml: html, citationIds: [] };
  }

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return { cleanedHtml: html, citationIds: [] };

  const citationIds: string[] = [];
  root.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href")?.trim();
    if (!href) return;

    let citation = citationByHref.get(href);
    if (!citation) {
      let fallbackTitle = href;
      try {
        fallbackTitle = new URL(href, window.location.origin).hostname.replace(/^www\./, "");
      } catch {
        fallbackTitle = href;
      }
      const title = anchor.textContent?.trim() && anchor.textContent.trim() !== href
        ? anchor.textContent.trim()
        : fallbackTitle;
      citation = buildFallbackCitation(`fallback-${citations.length + 1}`, title, href);
      citations.push(citation);
      citationByHref.set(href, citation);
    }

    if (!citationIds.includes(citation.id)) {
      citationIds.push(citation.id);
    }

    const paragraph = anchor.closest("p");
    if (paragraph) {
      const paragraphText = paragraph.textContent?.trim() || "";
      const anchorText = anchor.textContent?.trim() || "";
      const normalized = paragraphText.replace(/\s+/g, " ");
      if (
        normalized === href ||
        normalized === anchorText ||
        normalized === `${anchorText}.` ||
        normalized === `${href}.`
      ) {
        paragraph.remove();
        return;
      }
    }

    anchor.remove();
  });

  return {
    cleanedHtml: sanitizeRichHtml(root.innerHTML),
    citationIds,
  };
}

function getFallbackStructuredCitationIds(
  citations: ResearchReport["citations"],
  offset: number,
  windowSize = 3,
): string[] {
  if (!citations.length) return [];
  const ids = citations.map((citation) => citation.id);
  const start = Math.min(offset * windowSize, Math.max(ids.length - windowSize, 0));
  return ids.slice(start, start + windowSize);
}

function buildResearchDocumentHtml(
  report: ResearchReport,
  reportTitle: string,
  executiveSummaryRich: string,
  sectionTitles: Record<string, string>,
  sectionRichContent: Record<string, string>,
  citationIndexLookup: Map<string, number>,
): string {
  const fallbackCitations: ResearchReport["citations"] = [];
  const fallbackCitationByHref = new Map<string, ResearchReport["citations"][number]>();
  const hasStructuredCitations = (report.citations?.length || 0) > 0;
  let summaryHtml = ensureRichHtml(report.executive_summary, executiveSummaryRich);
  summaryHtml = stripSourceUrlsFromHtml(summaryHtml);
  summaryHtml = stripCitationIdArtifactsFromHtml(summaryHtml);
  let summaryCitationIds: string[] = report.publisher_payload?.executive_summary_citation_ids || [];
  const publisherSectionLookup = new Map(
    (report.publisher_payload?.sections || []).map((section) => [section.section_id, section])
  );

  if (!hasStructuredCitations) {
    const extractedSummary = extractFallbackCitationsFromHtml(summaryHtml, fallbackCitations, fallbackCitationByHref);
    summaryHtml = extractedSummary.cleanedHtml;
    summaryCitationIds = extractedSummary.citationIds;
  } else if (!summaryCitationIds.length) {
    summaryCitationIds = getFallbackStructuredCitationIds(report.citations || [], 0, 2);
  }

  const sectionsHtml = report.sections
    .map((section, index) => {
      let bodyHtml = ensureRichHtml(section.content, sectionRichContent[section.id] ?? section.rich_content);
      bodyHtml = stripSourceUrlsFromHtml(bodyHtml);
      bodyHtml = stripCitationIdArtifactsFromHtml(bodyHtml);
      let sectionCitationIds = publisherSectionLookup.get(section.id)?.citation_ids || section.citations || [];

      if (!hasStructuredCitations) {
        const extractedSection = extractFallbackCitationsFromHtml(bodyHtml, fallbackCitations, fallbackCitationByHref);
        bodyHtml = extractedSection.cleanedHtml;
        sectionCitationIds = extractedSection.citationIds;
      } else if (!sectionCitationIds.length) {
        sectionCitationIds = getFallbackStructuredCitationIds(report.citations || [], index + 1);
      }

      const effectiveCitations = hasStructuredCitations ? report.citations : fallbackCitations;
      const effectiveLookup = hasStructuredCitations
        ? citationIndexLookup
        : new Map(effectiveCitations.map((citation, citationIndex) => [citation.id, citationIndex + 1]));
      const effectiveReport = { ...report, citations: effectiveCitations };
      const inlineCitations = buildInlineCitationHtml(effectiveReport, sectionCitationIds, effectiveLookup);
      const bodyWithInlineCitations = injectInlineCitations(bodyHtml, inlineCitations);
      return `
        <section id="${section.id}" data-section-anchor="${section.id}" data-report-part="section" data-section-id="${section.id}">
          <h2>${index + 1}. ${sectionTitles[section.id] ?? section.title}</h2>
          <div data-report-body="true">${bodyWithInlineCitations}</div>
        </section>
      `;
    })
    .join("");

  const effectiveCitations = hasStructuredCitations ? report.citations : fallbackCitations;
  const effectiveLookup = hasStructuredCitations
    ? citationIndexLookup
    : new Map(effectiveCitations.map((citation, index) => [citation.id, index + 1]));
  const summaryWithInlineCitations = injectInlineCitations(
    summaryHtml,
    buildInlineCitationHtml({ ...report, citations: effectiveCitations }, summaryCitationIds, effectiveLookup)
  );

  const endnotesHtml = effectiveCitations?.length
    ? `
      <section id="sources-endnotes" data-section-anchor="sources-endnotes" data-report-part="endnotes" contenteditable="false">
        <h2>Sources used in the report</h2>
        <p class="mb-4 text-sm text-muted-foreground">Hover or open inline citations in the report body, or review the full source list here.</p>
        <div class="space-y-3">
          ${effectiveCitations
            .map((citation, index) => `
              <details id="citation-${index + 1}" class="rounded-2xl border border-black/5 bg-[#f5f6f9] px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-[#141922]">
                <summary class="flex cursor-pointer items-center gap-3 list-none">
                  <span class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-muted-foreground dark:bg-[#0f1318]">[${index + 1}]</span>
                  ${
                    citation.document_url
                      ? `<a href="${citation.document_url}" target="_blank" rel="noopener noreferrer" class="min-w-0 truncate font-medium text-primary hover:underline">${citation.title}</a>`
                      : `<span class="min-w-0 truncate font-medium text-foreground">${citation.title}</span>`
                  }
                  <span class="ml-auto text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Source</span>
                </summary>
                <div class="mt-3 pl-9 text-muted-foreground leading-relaxed">
                  ${getCitationMeta(citation) || "Primary supporting source used in the report."}
                  ${
                    (citation.document_url || citation.external_url)
                      ? `<div class="mt-2"><a href="${citation.document_url || citation.external_url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Open source in new tab</a></div>`
                      : ""
                  }
                </div>
              </details>
            `)
            .join("")}
        </div>
      </section>
    `
    : "";

  return sanitizeRichHtml(`
    <header data-report-part="header">
      <h1>${reportTitle || report.title}</h1>
    </header>
    <section id="executive-summary" data-section-anchor="executive-summary" data-report-part="executive-summary">
      <h2>Executive Summary</h2>
      <div data-report-body="true">${summaryWithInlineCitations}</div>
    </section>
    ${sectionsHtml}
    ${endnotesHtml}
  `);
}

function buildBriefDocumentHtml(
  originalQuery: string,
  topics: Array<{
    id: string;
    title: string;
    description: string;
    keywords: string[];
  }>,
): string {
  const topicsHtml = topics
    .map(
      (topic, index) => `
        <section data-section-anchor="topic-${topic.id}" data-brief-part="topic" data-topic-id="${topic.id}">
          <h2>${index + 1}. ${topic.title || "Untitled topic"}</h2>
          <div data-brief-body="true">${ensureRichHtml(topic.description || "", null)}</div>
          <p data-brief-keywords="true"><strong>Keywords:</strong> ${topic.keywords.join(", ") || "Add keywords"}</p>
        </section>
      `
    )
    .join("");

  return sanitizeRichHtml(`
    <header data-brief-part="header">
      <h1>Research Plan</h1>
      <blockquote>${originalQuery}</blockquote>
    </header>
    ${topicsHtml}
  `);
}

function buildResearchKickoffDocumentHtml(query: string): string {
  return sanitizeRichHtml(`
    <header data-report-part="header">
      <h1>Research Brief</h1>
      <p>Shape the opening instruction the agent will use to draft the plan.</p>
    </header>
    <section id="research-objective" data-section-anchor="research-objective" data-report-part="section" data-section-id="research-objective">
      <h2>Research Objective</h2>
      <div data-report-body="true">${ensureRichHtml(
        query || "Describe the legal and commercial question you want answered, the jurisdiction, and the outcome you need."
      )}</div>
    </section>
    <section id="research-notes" data-section-anchor="research-notes" data-report-part="section" data-section-id="research-notes" contenteditable="false">
      <h2>What happens next</h2>
      <p>The system will turn this brief into a research plan, ask clarifying questions if needed, then generate a cited report in the document canvas.</p>
    </section>
  `);
}

function parseResearchKickoffDocumentHtml(html: string, fallbackQuery: string): string {
  if (typeof window === "undefined") return fallbackQuery;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const objectiveNode = doc.querySelector<HTMLElement>("[data-section-id='research-objective'] [data-report-body]");
  const objectiveHtml = sanitizeRichHtml(objectiveNode?.innerHTML || ensureRichHtml(fallbackQuery || ""));
  return richHtmlToPlainText(objectiveHtml).trim();
}

function parseBriefDocumentHtml(
  html: string,
  fallbackTopics: Array<{
    id: string;
    title: string;
    description: string;
    keywords: string[];
    priority: number;
  }>,
): Array<{
  id: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
}> {
  if (typeof window === "undefined") return fallbackTopics;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const parsedTopics = fallbackTopics.map((topic, index) => {
    const topicNode = doc.querySelector<HTMLElement>(`[data-brief-part='topic'][data-topic-id='${topic.id}']`);
    const bodyNode = topicNode?.querySelector<HTMLElement>("[data-brief-body]");
    const heading = topicNode?.querySelector("h2")?.textContent?.trim() || topic.title;
    const keywordsText = topicNode?.querySelector<HTMLElement>("[data-brief-keywords]")?.textContent || "";
    const keywords = keywordsText
      .replace(/^Keywords:\s*/i, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      ...topic,
      priority: index + 1,
      title: heading.replace(/^\d+\.\s*/, "").trim() || topic.title,
      description: richHtmlToPlainText(bodyNode?.innerHTML || ensureRichHtml(topic.description || "", null)),
      keywords,
    };
  });

  return parsedTopics;
}

function parseResearchDocumentHtml(
  html: string,
  report: ResearchReport,
): {
  title: string;
  executiveSummaryPlain: string;
  executiveSummaryRich: string;
  sectionTitles: Record<string, string>;
  sectionsPlain: Record<string, string>;
  sectionsRich: Record<string, string>;
} {
  if (typeof window === "undefined") {
    return {
      title: report.title,
      executiveSummaryPlain: report.executive_summary,
      executiveSummaryRich: ensureRichHtml(report.executive_summary, report.executive_summary_rich),
      sectionTitles: Object.fromEntries(report.sections.map((section) => [section.id, section.title])),
      sectionsPlain: Object.fromEntries(report.sections.map((section) => [section.id, section.content])),
      sectionsRich: Object.fromEntries(
        report.sections.map((section) => [section.id, ensureRichHtml(section.content, section.rich_content)])
      ),
    };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.querySelector("header h1")?.textContent?.trim() || report.title;
  const executiveSummaryNode = doc.querySelector<HTMLElement>("[data-report-part='executive-summary'] [data-report-body]");
  const executiveSummaryRich = sanitizeRichHtml(executiveSummaryNode?.innerHTML || ensureRichHtml(report.executive_summary, report.executive_summary_rich));
  const sectionTitles: Record<string, string> = {};
  const sectionsPlain: Record<string, string> = {};
  const sectionsRich: Record<string, string> = {};

  report.sections.forEach((section) => {
    const sectionNode = doc.querySelector<HTMLElement>(`[data-report-part='section'][data-section-id='${section.id}']`);
    const bodyNode = sectionNode?.querySelector<HTMLElement>("[data-report-body]");
    const bodyHtml = sanitizeRichHtml(bodyNode?.innerHTML || ensureRichHtml(section.content, section.rich_content));
    sectionsRich[section.id] = bodyHtml;
    sectionsPlain[section.id] = richHtmlToPlainText(bodyHtml);

    const heading = sectionNode?.querySelector("h2")?.textContent?.trim();
    sectionTitles[section.id] = heading?.replace(/^\d+\.\s*/, "").trim() || section.title;
  });

  return {
    title,
    executiveSummaryPlain: richHtmlToPlainText(executiveSummaryRich),
    executiveSummaryRich,
    sectionTitles,
    sectionsPlain,
    sectionsRich,
  };
}

// Get default progress message based on status
function getDefaultProgressMessage(status: string): string {
  switch (status) {
    case "researching":
      return "Searching legal databases and analyzing sources...";
    case "writing":
      return "Generating comprehensive research report...";
    case "complete":
      return "Research complete!";
    case "error":
      return "An error occurred during research.";
    default:
      return "Processing your research request...";
  }
}

function normalizeResearchLabel(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferLiveTopicStatuses(
  topics: Array<{
    id: string;
    title: string;
    status?: string;
  }>,
  progressMessage: string,
  phase: "researching" | "writing",
  progressPercent: number,
): Record<string, "pending" | "in_progress" | "completed"> {
  const statuses: Record<string, "pending" | "in_progress" | "completed"> = {};

  topics.forEach((topic) => {
    const status = topic.status;
    statuses[topic.id] = status === "completed" || status === "in_progress" ? status : "pending";
  });

  if (!topics.length) {
    return statuses;
  }

  const normalizedMessage = normalizeResearchLabel(progressMessage);
  const completedMatch = progressMessage.match(/Completed\s+(\d+)\/(\d+)/i);
  if (completedMatch) {
    const completedCount = Math.min(Number.parseInt(completedMatch[1] || "0", 10), topics.length);
    for (let index = 0; index < completedCount; index += 1) {
      statuses[topics[index].id] = "completed";
    }
  }

  const synthesisSignal = /(executive summary|synthesi|assembl|writing|final report|conclusion)/i.test(progressMessage);
  if ((phase === "writing" && progressPercent >= 70) || synthesisSignal) {
      topics.forEach((topic) => {
        statuses[topic.id] = "completed";
      });
      return statuses;
  }

  let activeTopicId: string | null = null;
  for (const topic of topics) {
    if (statuses[topic.id] === "completed") continue;
    const normalizedTitle = normalizeResearchLabel(topic.title);
    if (normalizedTitle && normalizedMessage.includes(normalizedTitle)) {
      activeTopicId = topic.id;
      break;
    }
  }

  if (!activeTopicId && phase === "researching") {
    const firstPendingTopic = topics.find((topic) => statuses[topic.id] !== "completed");
    if (firstPendingTopic && progressPercent > 0) {
      activeTopicId = firstPendingTopic.id;
    }
  }

  if (activeTopicId && statuses[activeTopicId] !== "completed") {
    statuses[activeTopicId] = "in_progress";
  }

  return statuses;
}

function ResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh: refreshEntitlements } = useEntitlements();
  const initialQuery = searchParams.get("q");
  const sessionIdParam = searchParams.get("session");

  const [session, setSession] = useState<ResearchSession | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [query, setQuery] = useState(initialQuery || "");
  const [kickoffEditor, setKickoffEditor] = useState<HTMLElement | null>(null);
  const [researchKickoffHtml, setResearchKickoffHtml] = useState(() => buildResearchKickoffDocumentHtml(initialQuery || ""));
  const [clarifyAnswers, setClarifyAnswers] = useState<ClarifyAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StreamProgress | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  // Research sessions store for persistence
  const { addSession, updateSession: updateStoredSession } = useResearchSessionsStore();

  // Brief editing state
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editedTopics, setEditedTopics] = useState<Array<{
    id: string;
    title: string;
    description: string;
    keywords: string[];
    priority: number;
  }>>([]);
  const [editedJurisdictions, setEditedJurisdictions] = useState<string[]>([]);
  const [editedDocTypes, setEditedDocTypes] = useState<string[]>([]);
  const [editedTimeScope, setEditedTimeScope] = useState("current");
  const [editedReportFormat, setEditedReportFormat] = useState("comprehensive");
  const [editedReportTitle, setEditedReportTitle] = useState("");
  const [editedExecutiveSummary, setEditedExecutiveSummary] = useState("");
  const [editedExecutiveSummaryRich, setEditedExecutiveSummaryRich] = useState("");
  const [editedReportSectionTitles, setEditedReportSectionTitles] = useState<Record<string, string>>({});
  const [editedReportSections, setEditedReportSections] = useState<Record<string, string>>({});
  const [editedReportSectionsRich, setEditedReportSectionsRich] = useState<Record<string, string>>({});
  const [activeReportSection, setActiveReportSection] = useState<string | null>(null);
  const [briefEditor, setBriefEditor] = useState<HTMLElement | null>(null);
  const [reportEditor, setReportEditor] = useState<HTMLElement | null>(null);
  const [briefSaveState, setBriefSaveState] = useState<"idle" | "saving" | "saved" | "error" | "rate_limited">("idle");
  const [reportSaveState, setReportSaveState] = useState<"idle" | "saving" | "saved" | "error" | "rate_limited">("idle");
  const reportSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const briefSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const briefRetryAtRef = useRef(0);
  const reportRetryAtRef = useRef(0);
  const hydratedBriefRef = useRef(false);
  const hydratedReportRef = useRef(false);
  const lastSavedBriefRef = useRef<string | null>(null);
  const lastSavedReportRef = useRef<string | null>(null);
  const { isOnline, wasOffline, isHydrated } = useOnlineStatus();

  useEffect(() => {
    if (sessionIdParam || typeof window === "undefined") return;
    const activeSessionId = window.localStorage.getItem(ACTIVE_RESEARCH_SESSION_KEY);
    if (activeSessionId) {
      router.replace(`/research?session=${activeSessionId}`);
    }
  }, [router, sessionIdParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session && !["complete", "error"].includes(session.status)) {
      window.localStorage.setItem(ACTIVE_RESEARCH_SESSION_KEY, session.session_id);
      return;
    }
    if (session?.status === "complete" || session?.status === "error") {
      window.localStorage.removeItem(ACTIVE_RESEARCH_SESSION_KEY);
    }
  }, [session]);

  // Initialize editing state when brief is available
  useEffect(() => {
    if (session?.research_brief && !isEditingBrief) {
      setEditedTopics(session.research_brief.topics?.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        keywords: t.keywords || [],
        priority: t.priority || 1,
      })) || []);
      setEditedJurisdictions(session.research_brief.jurisdictions || ["Uganda"]);
      // Filter out any invalid document types from backend response
      const validDocTypes = ["legislation", "judgment", "regulation", "schedule", "treaty", "web"];
      const backendDocTypes = session.research_brief.document_types || [];
      setEditedDocTypes(backendDocTypes.filter(dt => validDocTypes.includes(dt)).length > 0
        ? backendDocTypes.filter(dt => validDocTypes.includes(dt))
        : ["legislation", "judgment"]);
      setEditedTimeScope(session.research_brief.time_scope || "current");
      setEditedReportFormat(session.research_brief.report_format || "comprehensive");
    }
  }, [session?.research_brief, isEditingBrief]);

  useEffect(() => {
    if (session?.status === "brief_review") {
      setIsEditingBrief(true);
    }
  }, [session?.status]);

  useEffect(() => {
    if (!report || typeof window === "undefined") return;
    const storedDraft = window.localStorage.getItem(researchReportDraftKey(report.id));
    if (!storedDraft) {
      setEditedReportTitle(report.title);
      setEditedExecutiveSummary(report.executive_summary);
      setEditedExecutiveSummaryRich(
        ensureRichHtml(report.executive_summary, report.executive_summary_rich)
      );
      setEditedReportSectionTitles(
        Object.fromEntries(report.sections.map((section) => [section.id, section.title]))
      );
      setEditedReportSections(
        Object.fromEntries(report.sections.map((section) => [section.id, section.content]))
      );
      setEditedReportSectionsRich(
        Object.fromEntries(
          report.sections.map((section) => [
            section.id,
            ensureRichHtml(section.content, section.rich_content),
          ])
        )
      );
      return;
    }

    try {
      const parsed = JSON.parse(storedDraft) as {
        title?: string;
        executiveSummary?: string;
        executiveSummaryRich?: string;
        sectionTitles?: Record<string, string>;
        sections?: Record<string, string>;
        sectionsRich?: Record<string, string>;
      };
      setEditedReportTitle(parsed.title || report.title);
      setEditedExecutiveSummary(parsed.executiveSummary || report.executive_summary);
      setEditedExecutiveSummaryRich(
        parsed.executiveSummaryRich || ensureRichHtml(report.executive_summary, report.executive_summary_rich)
      );
      setEditedReportSectionTitles(
        parsed.sectionTitles && Object.keys(parsed.sectionTitles).length > 0
          ? parsed.sectionTitles
          : Object.fromEntries(report.sections.map((section) => [section.id, section.title]))
      );
      setEditedReportSections(
        parsed.sections && Object.keys(parsed.sections).length > 0
          ? parsed.sections
          : Object.fromEntries(report.sections.map((section) => [section.id, section.content]))
      );
      setEditedReportSectionsRich(
        parsed.sectionsRich && Object.keys(parsed.sectionsRich).length > 0
          ? parsed.sectionsRich
          : Object.fromEntries(
              report.sections.map((section) => [
                section.id,
                ensureRichHtml(section.content, section.rich_content),
              ])
            )
      );
    } catch {
      setEditedReportTitle(report.title);
      setEditedExecutiveSummary(report.executive_summary);
      setEditedExecutiveSummaryRich(
        ensureRichHtml(report.executive_summary, report.executive_summary_rich)
      );
      setEditedReportSectionTitles(
        Object.fromEntries(report.sections.map((section) => [section.id, section.title]))
      );
      setEditedReportSections(
        Object.fromEntries(report.sections.map((section) => [section.id, section.content]))
      );
      setEditedReportSectionsRich(
        Object.fromEntries(
          report.sections.map((section) => [
            section.id,
            ensureRichHtml(section.content, section.rich_content),
          ])
        )
      );
    }
  }, [report]);

  const buildBriefDraft = useCallback((): ApproveBriefRequest["brief"] | null => {
    if (!session?.research_brief) return null;

    const topicsSource = editedTopics.length > 0
      ? editedTopics
      : session.research_brief.topics?.map((topic) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description || "",
          keywords: topic.keywords || [],
          priority: topic.priority || 1,
        })) || [];

    return {
      query: session.research_brief.original_query,
      clarifications: session.research_brief.clarifications || [],
      jurisdictions: editedJurisdictions.length > 0 ? editedJurisdictions : ["Uganda"],
      document_types: editedDocTypes.length > 0 ? editedDocTypes : ["legislation", "judgment"],
      time_scope: editedTimeScope || "current",
      topics: topicsSource.map((topic, index) => ({
        title: topic.title,
        description: topic.description || "",
        keywords: topic.keywords || [],
        priority: index + 1,
      })),
      report_format: editedReportFormat || "comprehensive",
      include_recommendations: session.research_brief.include_recommendations ?? true,
    };
  }, [
    editedDocTypes,
    editedJurisdictions,
    editedReportFormat,
    editedTimeScope,
    editedTopics,
    session?.research_brief,
  ]);

  useEffect(() => {
    if (!report || typeof window === "undefined") return;
    window.localStorage.setItem(
      researchReportDraftKey(report.id),
      JSON.stringify({
        title: editedReportTitle,
        executiveSummary: editedExecutiveSummary,
        executiveSummaryRich: editedExecutiveSummaryRich,
        sectionTitles: editedReportSectionTitles,
        sections: editedReportSections,
        sectionsRich: editedReportSectionsRich,
      })
    );
  }, [editedExecutiveSummary, editedExecutiveSummaryRich, editedReportSectionTitles, editedReportSections, editedReportSectionsRich, editedReportTitle, report]);

  useEffect(() => {
    if (session?.status !== "brief_review" || !session.research_brief) return;
    if (!hydratedBriefRef.current) {
      hydratedBriefRef.current = true;
      return;
    }

    const brief = buildBriefDraft();
    if (!brief) return;
    
    const currentBriefHash = JSON.stringify(brief);
    if (lastSavedBriefRef.current === currentBriefHash) return;

    if (briefSaveTimerRef.current) {
      clearTimeout(briefSaveTimerRef.current);
    }

    const delay = Math.max(BRIEF_AUTOSAVE_DEBOUNCE_MS, briefRetryAtRef.current - Date.now(), 0);
    briefSaveTimerRef.current = setTimeout(async () => {
      setBriefSaveState("saving");
      try {
        lastSavedBriefRef.current = currentBriefHash;
        const updatedSession = await saveResearchBrief(session.session_id, { brief });
        setSession(updatedSession);
        setBriefSaveState("saved");
      } catch (error) {
        lastSavedBriefRef.current = null;
        if (error instanceof APIError && error.status === 429) {
          briefRetryAtRef.current = Date.now() + RATE_LIMIT_BACKOFF_MS;
          setBriefSaveState("rate_limited");
          return;
        }
        setBriefSaveState("error");
      }
    }, delay);

    return () => {
      if (briefSaveTimerRef.current) {
        clearTimeout(briefSaveTimerRef.current);
      }
    };
  }, [buildBriefDraft, session?.research_brief, session?.session_id, session?.status]);

  useEffect(() => {
    if (!report || session?.status !== "complete") return;
    if (!hydratedReportRef.current) {
      hydratedReportRef.current = true;
      return;
    }

    const draftToSave = {
      title: editedReportTitle || report.title,
      executive_summary: editedExecutiveSummary,
      executive_summary_rich: editedExecutiveSummaryRich,
      sections: report.sections.map((section) => ({
        ...section,
        title: editedReportSectionTitles[section.id] ?? section.title,
        content: editedReportSections[section.id] ?? section.content,
        rich_content: editedReportSectionsRich[section.id] ?? section.rich_content,
      })),
    };

    const currentReportHash = JSON.stringify(draftToSave);
    if (lastSavedReportRef.current === currentReportHash) return;

    if (reportSaveTimerRef.current) {
      clearTimeout(reportSaveTimerRef.current);
    }

    const delay = Math.max(REPORT_AUTOSAVE_DEBOUNCE_MS, reportRetryAtRef.current - Date.now(), 0);
    reportSaveTimerRef.current = setTimeout(async () => {
      setReportSaveState("saving");
      try {
        lastSavedReportRef.current = currentReportHash;
        const updatedReport = await saveResearchReport(session.session_id, draftToSave);
        setReport(updatedReport);
        setReportSaveState("saved");
      } catch (error) {
        lastSavedReportRef.current = null;
        if (error instanceof APIError && error.status === 429) {
          reportRetryAtRef.current = Date.now() + RATE_LIMIT_BACKOFF_MS;
          setReportSaveState("rate_limited");
          return;
        }
        setReportSaveState("error");
      }
    }, delay);

    return () => {
      if (reportSaveTimerRef.current) {
        clearTimeout(reportSaveTimerRef.current);
      }
    };
  }, [
    editedExecutiveSummary,
    editedExecutiveSummaryRich,
    editedReportSectionTitles,
    editedReportSections,
    editedReportSectionsRich,
    editedReportTitle,
    report,
    session?.session_id,
    session?.status,
  ]);

  const citationIndexLookup = useMemo(() => {
    if (!report?.citations) return new Map<string, number>();
    return new Map(report.citations.map((citation, index) => [citation.id, index + 1]));
  }, [report]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const sessionData = await getResearchSession(sessionId);

      // Use status (not phase) to determine what to show
      // Check for redirect cases first - these are "complete" but have no report
      if (sessionData.current_step === "redirect_to_chat") {
        setSession(sessionData);
        setError("This query was handled by regular chat. Deep research is for complex legal questions requiring multi-source analysis.");
      } else if (sessionData.current_step === "redirect_to_contract") {
        setSession(sessionData);
        setError("This query is better suited for contract drafting. Please use the Contracts feature.");
      } else if (sessionData.status === "complete") {
        // For complete status, fetch report FIRST to avoid flickering
        let reportData = sessionData.report;
        if (!reportData) {
          reportData = await getResearchReport(sessionId);
        }
        // Set report before session to avoid "complete but no report" flicker
        setReport(reportData);
        setSession(sessionData);
        // Refresh entitlements to update usage counts
        refreshEntitlements();
      } else if (["researching", "writing"].includes(sessionData.status)) {
        setSession(sessionData);
        startProgressStream(sessionId);
      } else {
        setSession(sessionData);
      }

      // Track session in store
      addSession({
        id: sessionData.session_id,
        query: sessionData.query,
        title: sessionData.report?.title || sessionData.query.slice(0, 60),
        status: sessionData.status,
        createdAt: sessionData.created_at,
        reportReady: sessionData.status === "complete",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSession, refreshEntitlements, updateStoredSession]);

  // Load existing session if session ID provided
  useEffect(() => {
    if (sessionIdParam) {
      loadSession(sessionIdParam);
    }
  }, [sessionIdParam, loadSession]);

  // Auto-start if query provided
  useEffect(() => {
    if (initialQuery && !sessionIdParam && !session) {
      handleStartResearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleStartResearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const newSession = await createResearchSession({ query: query.trim() });
      setSession(newSession);

      // Track new session in store
      addSession({
        id: newSession.session_id,
        query: newSession.query,
        title: newSession.query.slice(0, 60),
        status: newSession.status,
        createdAt: newSession.created_at,
        reportReady: false,
      });

      router.replace(`/research?session=${newSession.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start research");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitClarifications = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedSession = await submitClarifyingAnswers(
        session.session_id,
        clarifyAnswers
      );
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveBrief = async () => {
    if (!session || !session.research_brief) return;

    setIsLoading(true);
    setError(null);

    try {
      const brief = buildBriefDraft();
      if (!brief) return;
      const briefRequest: ApproveBriefRequest = {
        brief,
      };

      const updatedSession = await approveResearchBrief(session.session_id, briefRequest);
      setSession(updatedSession);
      setIsEditingBrief(false);
      startProgressStream(session.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve brief");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeResearch = async () => {
    if (!session) return;

    setIsResuming(true);
    setError(null);

    try {
      const resumedSession = await resumeResearchSession(session.session_id);
      setSession(resumedSession);
      setProgress({
        phase: "researching",
        message: resumedSession.current_step || "Resuming research from last checkpoint...",
        progress: resumedSession.progress_percent || 0,
      });
      updateStoredSession(session.session_id, { status: "researching", reportReady: false });
      startProgressStream(session.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume research");
    } finally {
      setIsResuming(false);
    }
  };

  const renderCheckpointList = (checkpoints?: ResearchGraphCheckpoint[] | null) => {
    if (!checkpoints || checkpoints.length === 0) return null;

    return (
      <div className="mt-6 w-full max-w-xl rounded-lg border bg-muted/30 p-4 text-left">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Graph Checkpoints</p>
          <Badge variant="outline">{checkpoints.length}</Badge>
        </div>
        <div className="space-y-2">
          {checkpoints.slice(-5).reverse().map((checkpoint, index) => (
            <div key={`${checkpoint.node}-${checkpoint.recorded_at || index}`} className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{checkpoint.node}</p>
                <p className="text-xs text-muted-foreground">
                  Phase: {checkpoint.phase || "unknown"}
                  {checkpoint.finding_count !== undefined ? ` | Findings: ${checkpoint.finding_count}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {checkpoint.recorded_at && (
                  <p className="text-xs text-muted-foreground">
                    {formatDateOnly(checkpoint.recorded_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper functions for brief editing
  const addTopic = () => {
    setEditedTopics([...editedTopics, {
      id: `topic-${Date.now()}`,
      title: "",
      description: "",
      keywords: [],
      priority: editedTopics.length + 1,
    }]);
  };

  const toggleDocType = (docType: string) => {
    if (editedDocTypes.includes(docType)) {
      setEditedDocTypes(editedDocTypes.filter(dt => dt !== docType));
    } else {
      setEditedDocTypes([...editedDocTypes, docType]);
    }
  };

  const handleExportWord = useCallback(() => {
    if (!report) return;
    exportResearchReportToWord(
      report,
      editedReportTitle || report.title,
      editedExecutiveSummary,
      editedReportSections,
      editedExecutiveSummaryRich,
      editedReportSectionsRich,
    );
  }, [editedExecutiveSummary, editedExecutiveSummaryRich, editedReportSections, editedReportSectionsRich, editedReportTitle, report]);

  // Polling fallback for when SSE fails
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingResumeTimerRef.current) {
      clearTimeout(pollingResumeTimerRef.current);
      pollingResumeTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((sessionId: string) => {
    // Poll every 3 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const sessionData = await getResearchSession(sessionId);

        // Check for completion FIRST - don't update session until report is ready
        if (sessionData.status === "complete") {
          stopPolling();

          // Fetch report first, then update all state together
          let reportData = sessionData.report;
          if (!reportData) {
            reportData = await getResearchReport(sessionId);
          }

          // Update both report and session together to avoid flickering
          setReport(reportData);
          setSession(sessionData);

          updateStoredSession(sessionId, {
            status: "complete",
            title: reportData?.title || sessionData.query.slice(0, 60),
            reportReady: true,
          });
          // Refresh entitlements to update usage counts
          refreshEntitlements();
        } else if (sessionData.status === "error") {
          stopPolling();
          setSession(sessionData);
          setError(sessionData.error || "Research failed");
          updateStoredSession(sessionId, { status: "error" });
        } else {
          // Only update session for non-complete states
          setSession(sessionData);

          // Update progress from session data
          setProgress({
            phase: sessionData.status,
            message: sessionData.current_step || getDefaultProgressMessage(sessionData.status),
            progress: sessionData.progress_percent || 0,
          });
        }
      } catch (err) {
        if (err instanceof APIError && err.status === 429) {
          stopPolling();
          setProgress({
            phase: session?.status || "researching",
            message: "Sync paused briefly due to rate limiting. Retrying shortly...",
            progress: progress?.progress || session?.progress_percent || 0,
          });
          pollingResumeTimerRef.current = setTimeout(() => {
            startPolling(sessionId);
          }, RATE_LIMIT_BACKOFF_MS);
          return;
        }
        console.error("Polling error:", err);
        // Don't stop polling on transient errors
      }
    }, 3000);
  }, [progress?.progress, refreshEntitlements, session?.progress_percent, session?.status, stopPolling, updateStoredSession]);

  const startProgressStream = useCallback((sessionId: string) => {
    let sseCleanup: (() => void) | null = null;
    let usePolling = false;

    // Set initial progress message
    setProgress({
      phase: "researching",
      message: "Connecting to research stream...",
      progress: 0,
    });

    sseCleanup = streamResearchProgress(
      sessionId,
      (progressData) => {
        setProgress(progressData);
      },
      async () => {
        // On complete, fetch the report
        stopPolling();
        try {
          const reportData = await getResearchReport(sessionId);
          setReport(reportData);
          const sessionData = await getResearchSession(sessionId);
          setSession(sessionData);

          // Update stored session with completion status
          updateStoredSession(sessionId, {
            status: "complete",
            title: reportData.title,
            reportReady: true,
          });

          // Refresh entitlements to update usage counts
          refreshEntitlements();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load report");
        }
      },
      () => {
        // SSE failed - fall back to polling instead of showing error
        if (!usePolling) {
          usePolling = true;
          setProgress({
            phase: "researching",
            message: "Research in progress...",
            progress: 5,
          });
          startPolling(sessionId);
        }
      }
    );

    return () => {
      if (sseCleanup) sseCleanup();
      stopPolling();
    };
  }, [refreshEntitlements, startPolling, stopPolling, updateStoredSession]);

  const renderPhaseIndicator = () => {
    if (!session) return null;

    // Use status values from backend
    const statuses = ["clarifying", "brief_review", "researching", "writing", "complete"];
    const currentIndex = statuses.indexOf(session.status);

    return (
      <div className="flex items-center gap-2 mb-6">
        {statuses.slice(0, -1).map((status, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const info = statusLabels[status] || { label: status, description: "" };

          return (
            <div key={status} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      isComplete && "border-green-500 bg-green-500 text-white",
                      isCurrent && "border-primary bg-primary/10 text-primary",
                      !isComplete && !isCurrent && "border-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </TooltipContent>
              </Tooltip>
              {index < statuses.length - 2 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Initial query input
  if (!session && !sessionIdParam) {
    return (
      <TooltipProvider>
        <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-4">
              <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutPanelLeft className="h-4 w-4 text-blue-500" />
                Research Workspace
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/research/history" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Clock className="h-4 w-4" />
                View History
              </Link>
              <Button
                onClick={handleStartResearch}
                disabled={!query.trim() || isLoading}
                className="rounded-full px-5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Research...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Research
                  </>
                )}
              </Button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden w-72 shrink-0 border-r bg-[#fbfbf8] dark:bg-[#101317] lg:flex lg:flex-col lg:overflow-y-auto">
              <div className="space-y-8 p-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace Mode</h3>
                  <p className="mt-3 text-sm text-foreground">Draft the opening research brief directly in the document.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flow</h3>
                  <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <li className="text-foreground">1. Refine the brief in the canvas</li>
                    <li>2. Review the generated research plan</li>
                    <li>3. Track execution and edit the final report</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Output</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">Plan canvas</Badge>
                    <Badge variant="secondary" className="rounded-full">Cited report</Badge>
                    <Badge variant="secondary" className="rounded-full">Word export</Badge>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
                  The brief should read like an instruction memo, not a chat prompt fragment.
                </div>
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#f7f6f2] dark:bg-[#0b0d10] p-5 md:p-8 lg:p-10">
              <div className="mx-auto max-w-6xl pb-24">
                {error && (
                  <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#111318] dark:shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]">
                  <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-3">
                      <Search className="h-4 w-4 text-blue-500" />
                      <div className="truncate text-sm font-medium">Deep Legal Research</div>
                    </div>
                    <Badge variant="secondary" className="rounded-full">Editable brief</Badge>
                  </div>
                  <div className="sticky top-0 z-20 flex justify-center bg-white/90 px-4 pb-4 pt-3 backdrop-blur dark:bg-[#111318]/90">
                    <RichTextToolbar editor={kickoffEditor} disabled={!kickoffEditor} />
                  </div>
                  <EditableDocumentCanvas
                    html={researchKickoffHtml}
                    onEditorReady={setKickoffEditor}
                    surfaceClassName="rounded-none border-0 bg-transparent px-14 py-8 shadow-none"
                    onChange={(html) => {
                      setResearchKickoffHtml(html);
                      setQuery(parseResearchKickoffDocumentHtml(html, query));
                    }}
                  />
                </div>
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Loading state
  if (isLoading && !session) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Clarification phase
  if (session?.status === "clarifying") {
    const answeredCount = session.clarifying_questions?.filter((q) => Boolean(clarifyAnswers[q.id])).length ?? 0;
    const totalQuestions = session.clarifying_questions?.length ?? 0;
    const clarificationProgress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return (
      <TooltipProvider>
        <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-4">
              <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4 text-blue-500" />
                Research Intake Canvas
              </div>
            </div>
            <div className="flex items-center gap-3">{renderPhaseIndicator()}</div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden w-80 shrink-0 border-r bg-[#fbfbf8] dark:bg-[#101317] lg:flex lg:flex-col lg:overflow-y-auto">
              <div className="space-y-8 p-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Clarification Status</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{answeredCount} of {totalQuestions} answered</span>
                      <span>{clarificationProgress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.max(clarificationProgress, 4)}%` }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Research Query</h3>
                  <p className="mt-3 text-sm leading-6 text-foreground">{session.query}</p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Why These Questions Exist</h3>
                  <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <li>They refine jurisdiction, treaty exposure, and employer structure before the plan is generated.</li>
                    <li>The answers feed directly into the research brief and source strategy.</li>
                    <li>This keeps the final report tighter and more relevant.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
                  Treat this as annotating a memo. The next step opens the research plan using these answers.
                </div>
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#f7f6f2] dark:bg-[#0b0d10] p-5 md:p-8 lg:p-10">
              <div className="mx-auto max-w-5xl pb-24">
                <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#111318] dark:shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]">
                  <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 text-blue-500" />
                      <div className="text-sm font-medium">Help Us Understand Your Research</div>
                      <Badge variant="secondary" className="rounded-full">Question canvas</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{totalQuestions} prompts</div>
                  </div>

                  <div className="px-10 py-8 md:px-14">
                    <div className="mb-8">
                      <h1 className="font-serif text-[2rem] font-semibold tracking-tight text-foreground">Clarification Notes</h1>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Answer these questions so the next stage can open as a precise research plan instead of a generic outline.
                      </p>
                    </div>

                    <div className="mb-8 rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Original Query</div>
                      <p className="mt-3 text-sm leading-7 text-foreground">{session.query}</p>
                    </div>

                    <div className="space-y-8">
                      {session.clarifying_questions?.map((q, index) => (
                        <section key={q.id} className="border-b border-border/50 pb-8 last:border-b-0">
                          <div className="mb-4 flex items-start gap-3">
                            <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              {index + 1}
                            </div>
                            <div>
                              <h2 className="text-base font-semibold leading-7 text-foreground">{q.question}</h2>
                              <p className="mt-1 text-sm text-muted-foreground">This response shapes the plan scope, source mix, and final report framing.</p>
                            </div>
                          </div>
                          {q.options ? (
                            <RadioGroup
                              value={clarifyAnswers[q.id] || ""}
                              onValueChange={(value) =>
                                setClarifyAnswers((prev) => ({ ...prev, [q.id]: value }))
                              }
                              className="space-y-3"
                            >
                              {q.options.map((option) => (
                                <label
                                  key={option}
                                  htmlFor={`${q.id}-${option}`}
                                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/20"
                                >
                                  <RadioGroupItem value={option} id={`${q.id}-${option}`} className="mt-0.5" />
                                  <span className="text-sm leading-6 text-foreground">{option}</span>
                                </label>
                              ))}
                            </RadioGroup>
                          ) : (
                            <Input
                              value={clarifyAnswers[q.id] || ""}
                              onChange={(e) =>
                                setClarifyAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              placeholder="Type your answer..."
                              className="h-12 rounded-2xl"
                            />
                          )}
                        </section>
                      ))}
                    </div>

                    {error && (
                      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    <div className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white/90 px-5 py-4 text-sm shadow-sm dark:bg-[#111318]/90 dark:border-white/10">
                      <div className="text-muted-foreground">These answers are carried into the research plan automatically.</div>
                      <Button
                        onClick={handleSubmitClarifications}
                        disabled={
                          isLoading ||
                          (session.clarifying_questions?.some((q) => !clarifyAnswers[q.id]) ?? true)
                        }
                        className="rounded-full px-6"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Continue to Plan"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Brief approval phase
  if (session?.status === "brief_review" && session.research_brief) {
    const availableDocTypes = ["legislation", "judgment", "regulation", "schedule", "treaty", "web"];
    const availableJurisdictions = ["Uganda", "East Africa", "Commonwealth", "International"];
    const availableTimeScopes = [
      { value: "current", label: "Current law only" },
      { value: "historical", label: "Include historical versions" },
      { value: "all", label: "All time periods" },
    ];
    const availableFormats = [
      { value: "comprehensive", label: "Comprehensive (detailed analysis)" },
      { value: "summary", label: "Summary (key points only)" },
      { value: "brief", label: "Brief (quick overview)" },
    ];
    const briefDocumentHtml = buildBriefDocumentHtml(
      session.research_brief.original_query,
      editedTopics
    );

    return (
      <TooltipProvider>
        <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-4">
              <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutPanelLeft className="h-4 w-4 text-blue-500" />
                Research Plan Canvas
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {briefSaveState === "saving" && <><Loader2 className="h-3 w-3 animate-spin"/> Saving...</>}
                {briefSaveState === "saved" && <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Saved</span>}
                {briefSaveState === "rate_limited" && <span className="text-amber-600 dark:text-amber-400">Autosave paused briefly</span>}
                {briefSaveState === "error" && <span className="text-destructive">Save failed</span>}
              </div>
              <Button
                size="sm"
                onClick={handleApproveBrief}
                disabled={isLoading || editedTopics.length === 0}
                className="gap-2 rounded-full px-4"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isLoading ? "Starting..." : "Start Research"}
              </Button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Plan Context & Outline */}
            <aside className="hidden w-80 shrink-0 flex-col border-r bg-muted/10 lg:flex overflow-y-auto">
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Topic Outline</h3>
                  <div className="space-y-1">
                    {editedTopics.map((topic, i) => (
                      <div key={topic.id} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0 w-4 text-right">{i + 1}.</span>
                        <span className="truncate flex-1" title={topic.title}>{topic.title || "Untitled Topic"}</span>
                      </div>
                    ))}
                    {isEditingBrief && (
                      <Button variant="ghost" size="sm" onClick={addTopic} className="w-full justify-start mt-2 text-muted-foreground hover:text-foreground">
                        <Plus className="mr-2 h-4 w-4" /> Add Topic
                      </Button>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scope & Settings</h3>
                  
                  {/* Jurisdictions */}
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Jurisdictions</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {isEditingBrief ? availableJurisdictions.map(j => (
                        <Badge
                          key={j}
                          variant={editedJurisdictions.includes(j) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            if (editedJurisdictions.includes(j)) {
                              setEditedJurisdictions(editedJurisdictions.filter(jur => jur !== j));
                            } else {
                              setEditedJurisdictions([...editedJurisdictions, j]);
                            }
                          }}
                        >
                          {j}
                        </Badge>
                      )) : editedJurisdictions.map(j => <Badge key={j} variant="secondary" className="text-xs">{j}</Badge>)}
                    </div>
                  </div>

                  {/* Document Types */}
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Document Types</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {isEditingBrief ? availableDocTypes.map(dt => (
                        <Badge
                          key={dt}
                          variant={editedDocTypes.includes(dt) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleDocType(dt)}
                        >
                          {dt}
                        </Badge>
                      )) : editedDocTypes.map(dt => <Badge key={dt} variant="outline" className="text-xs">{dt}</Badge>)}
                    </div>
                  </div>

                  {/* Settings */}
                  {isEditingBrief ? (
                    <div className="space-y-4 pt-2">
                       <div>
                         <Label className="text-xs text-muted-foreground block mb-2">Time Scope</Label>
                         <Select value={editedTimeScope} onValueChange={setEditedTimeScope}>
                           <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>
                             {availableTimeScopes.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <Label className="text-xs text-muted-foreground block mb-2">Report Format</Label>
                         <Select value={editedReportFormat} onValueChange={setEditedReportFormat}>
                           <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>
                             {availableFormats.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground space-y-1 pt-2">
                      <div className="flex items-center justify-between">
                         <span>Time Scope:</span> <span className="font-medium text-foreground">{editedTimeScope}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span>Format:</span> <span className="font-medium text-foreground">{editedReportFormat}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border" />
                
                <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-950/30 p-3 rounded-lg flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Changes you make to this plan are saved automatically. When you are ready, click Start Research.</p>
                </div>
              </div>
            </aside>

            {/* Main Document Canvas */}
            <main className="flex-1 overflow-y-auto bg-[#f7f6f2] dark:bg-[#0b0d10] p-5 md:p-8 lg:p-10">
              <div className="mx-auto max-w-6xl pb-24">
                <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#111318] dark:shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]">
                  <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <LayoutPanelLeft className="h-4 w-4 text-blue-500" />
                      <div className="text-sm font-medium">Research Plan</div>
                      <Badge variant="secondary" className="rounded-full">Editable canvas</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        {editedTopics.length} topics
                      </div>
                      <Button variant="outline" size="sm" onClick={addTopic} className="rounded-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Topic
                      </Button>
                    </div>
                  </div>
                  <div className="sticky top-0 z-20 flex justify-center bg-white/90 px-4 pb-4 pt-3 backdrop-blur dark:bg-[#111318]/90">
                    <RichTextToolbar editor={briefEditor} disabled={!briefEditor} />
                  </div>
                  <EditableDocumentCanvas
                    html={briefDocumentHtml}
                    onEditorReady={setBriefEditor}
                    surfaceClassName="rounded-none border-0 bg-transparent px-14 py-8 shadow-none"
                    onChange={(html) => {
                      const parsedTopics = parseBriefDocumentHtml(html, editedTopics);
                      setEditedTopics(parsedTopics);
                    }}
                  />
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/60 bg-white/90 px-5 py-4 text-sm shadow-sm dark:bg-[#111318]/90 dark:border-white/10">
                  <div className="text-muted-foreground">
                    Edit the plan as one working document. Use the left rail for scope and output settings.
                  </div>
                  <div className="text-xs text-muted-foreground">Autosaves to your account across devices.</div>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Researching/Writing phase
  if (session?.status === "researching" || session?.status === "writing") {
    const progressPercent = progress?.progress ?? (session.progress_percent || 0);
    const progressMessage = progress?.message || session.current_step || getDefaultProgressMessage(session.status);
    const latestCheckpoint = session.graph_checkpoints?.[session.graph_checkpoints.length - 1];
    const isResumedRun = (session.current_step || "").startsWith("Resuming from checkpoint");
    const liveTopics = session.research_brief?.topics || [];
    const liveTopicStatuses = inferLiveTopicStatuses(liveTopics, progressMessage, session.status, progressPercent);
    const completedTopics = liveTopics.filter((topic) => liveTopicStatuses[topic.id] === "completed").length;
    const activeTopics = liveTopics.filter((topic) => liveTopicStatuses[topic.id] === "in_progress").length;

    return (
      <TooltipProvider>
        <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-4">
              <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                {session.status === "researching" ? "Researching..." : "Writing Report..."}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="animate-pulse bg-blue-500/10 text-blue-500 border-blue-500/20">
                Execution in progress
              </Badge>
              {isResumedRun && <Badge variant="secondary">Resumed</Badge>}
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Process Workspace */}
            <aside className="hidden w-80 shrink-0 border-r bg-[#fbfbf8] dark:bg-[#101317] lg:flex lg:flex-col lg:overflow-y-auto">
              <div className="space-y-6 p-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live Progress</h3>
                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-medium leading-relaxed text-foreground">{progressMessage}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>{progressPercent}% complete</span>
                        <span>{completedTopics}/{liveTopics.length || 0} topics closed</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(progressPercent, 5)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 dark:bg-[#111318]">
                        <div className="text-muted-foreground">Active topics</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">{activeTopics}</div>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 dark:bg-[#111318]">
                        <div className="text-muted-foreground">Checkpoints</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">{session.graph_checkpoints?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {(!isOnline && isHydrated) && (
                  <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-xs flex items-start gap-2">
                    <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>Offline. Run continues in background.</div>
                  </div>
                )}
                
                {wasOffline && (
                  <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-lg text-xs flex items-start gap-2">
                    <RefreshCcw className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>Connection restored. Re-syncing...</div>
                  </div>
                )}

                <div className="h-px bg-border my-4" />

                {liveTopics.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Research Topics</h3>
                    <div className="space-y-2">
                      {liveTopics.map((topic, index) => {
                        const topicStatus = liveTopicStatuses[topic.id] || "pending";
                        return (
                          <div
                            key={topic.id}
                            className={cn(
                              "rounded-2xl border px-3 py-3 text-sm transition-colors",
                              topicStatus === "completed" && "border-green-500/20 bg-green-500/5",
                              topicStatus === "in_progress" && "border-blue-500/20 bg-blue-500/5",
                              topicStatus === "pending" && "border-border/60 bg-background/70 dark:bg-[#111318]"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs text-muted-foreground">{index + 1}</div>
                                <div className="truncate font-medium text-foreground" title={topic.title}>{topic.title}</div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full text-[10px]",
                                  topicStatus === "completed" && "border-green-500/30 text-green-600 dark:text-green-400",
                                  topicStatus === "in_progress" && "border-blue-500/30 text-blue-600 dark:text-blue-400"
                                )}
                              >
                                {topicStatus.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                   <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Execution Trace</h3>
                   {latestCheckpoint && (
                     <div className="mb-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-3 py-3 text-xs">
                       <span className="text-muted-foreground">Current node: </span>
                       <span className="font-medium">{latestCheckpoint.node}</span>
                     </div>
                   )}
                   <div className="relative">
                     {/* Using the existing renderCheckpointList which renders a vertical timeline */}
                     {renderCheckpointList(session.graph_checkpoints)}
                   </div>
                </div>
              </div>
            </aside>

            {/* Main Canvas - Live Draft Workspace */}
            <main className="flex-1 overflow-y-auto bg-[#f7f6f2] dark:bg-[#0b0d10] p-5 md:p-8 lg:p-10">
              <div className="mx-auto max-w-6xl pb-24">
                <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#111318] dark:shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]">
                  <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <div className="truncate text-sm font-medium">
                        {session.status === "researching" ? "Research Draft Workspace" : "Report Assembly Workspace"}
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {session.status === "researching" ? "Live gathering" : "Synthesizing report"}
                    </Badge>
                  </div>

                  <div className="px-10 py-8 md:px-14">
                    <div className="mb-10">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Working Draft</div>
                      <h1 className="font-serif text-[2.2rem] font-semibold tracking-tight text-foreground">
                        {session.research_brief?.original_query || session.query}
                      </h1>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                        The research engine is turning your approved plan into a cited report. The workspace stays document-shaped so the shift into the final report canvas feels continuous.
                      </p>
                    </div>

                    <section className="mb-10 rounded-2xl border border-border/60 bg-muted/20 p-5 dark:bg-[#0f1318]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current Activity</div>
                          <p className="mt-2 text-sm font-medium text-foreground">{progressMessage}</p>
                        </div>
                        <div className="min-w-[140px]">
                          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                            <span>Overall progress</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${Math.max(progressPercent, 5)}%` }} />
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="space-y-10">
                      {liveTopics.length > 0 ? liveTopics.map((topic, index) => {
                        const topicStatus = liveTopicStatuses[topic.id] || "pending";
                        return (
                          <section key={topic.id} className="border-b border-border/50 pb-8 last:border-b-0">
                            <div className="mb-3 flex items-center gap-3">
                              <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                {index + 1}
                              </div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">{topic.title}</h2>
                                {topicStatus === "in_progress" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                {topicStatus === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              </div>
                            </div>
                            <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
                              {topic.description || "Research is gathering authorities, statutes, and external sources for this topic."}
                            </p>
                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4 text-sm dark:bg-[#0f1318]">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                                <div className="mt-2 font-medium text-foreground">{topicStatus.replace("_", " ")}</div>
                              </div>
                              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4 text-sm dark:bg-[#0f1318]">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Evidence mode</div>
                                <div className="mt-2 font-medium text-foreground">Authorities + web research</div>
                              </div>
                              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4 text-sm dark:bg-[#0f1318]">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Draft state</div>
                                <div className="mt-2 font-medium text-foreground">
                                  {topicStatus === "completed" ? "Ready for synthesis" : "Still compiling sources"}
                                </div>
                              </div>
                            </div>
                          </section>
                        );
                      }) : (
                        <div className="space-y-8">
                          <Skeleton className="h-10 w-3/4" />
                          <Skeleton className="h-32 w-full rounded-[24px]" />
                          <Skeleton className="h-32 w-full rounded-[24px]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Complete phase - show report
  if (session?.status === "complete" && report) {
    const scrollToSection = (sectionId: string) => {
      const element = reportSectionRefs.current[sectionId] ?? document.getElementById(sectionId);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveReportSection(sectionId);
    };
    const reportDocumentHtml = buildResearchDocumentHtml(
      report,
      editedReportTitle || report.title,
      editedExecutiveSummaryRich,
      editedReportSectionTitles,
      editedReportSectionsRich,
      citationIndexLookup,
    );

    return (
      <TooltipProvider>
        <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-4">
              <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{editedReportTitle || report.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
                {reportSaveState === "saving" && <><Loader2 className="h-3 w-3 animate-spin"/> Saving...</>}
                {reportSaveState === "saved" && <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Saved</span>}
                {reportSaveState === "rate_limited" && <span className="text-amber-600 dark:text-amber-400">Autosave paused briefly</span>}
                {reportSaveState === "error" && <span className="text-destructive">Save failed</span>}
              </div>
              <Button variant="outline" size="sm" onClick={handleExportWord} className="gap-2 rounded-full px-4">
                <Download className="h-4 w-4" />
                Share & Export
              </Button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Table of Contents & Metadata */}
            <aside className="hidden w-64 shrink-0 flex-col border-r bg-background lg:flex overflow-y-auto">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contents</h3>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => scrollToSection("executive-summary")}
                      className={cn(
                        "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50",
                        activeReportSection === "executive-summary" && "bg-muted font-medium text-foreground"
                      )}
                    >
                      Executive Summary
                    </button>
                    {report.sections.map((section, index) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50 truncate",
                          activeReportSection === section.id && "bg-muted font-medium text-foreground"
                        )}
                        title={editedReportSectionTitles[section.id] ?? section.title}
                      >
                        {index + 1}. {editedReportSectionTitles[section.id] ?? section.title}
                      </button>
                    ))}
                    <button
                      onClick={() => scrollToSection("sources-endnotes")}
                      className={cn(
                        "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50",
                        activeReportSection === "sources-endnotes" && "bg-muted font-medium text-foreground"
                      )}
                    >
                      Sources used in the report
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    <span className="text-foreground text-xs font-medium">Execution complete</span>
                  </div>
                  {report.citations?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">{report.citations.length} sources</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground/80 p-2 rounded-md bg-muted/30">
                  Click any section to edit. Changes auto-save.
                </div>
              </div>
            </aside>

            {/* Main Document Canvas */}
            <main className="flex-1 overflow-y-auto bg-[#f7f6f2] dark:bg-[#0b0d10] p-5 md:p-8 lg:p-10 relative">
	              <div className="mx-auto max-w-6xl pb-24">
                {!isOnline && isHydrated && (
                  <div className="mb-8 bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm flex items-start gap-3">
                    <WifiOff className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>You are offline. Your report edits are cached locally and will sync when reconnected.</div>
                  </div>
                )}
                <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#111318] dark:shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]">
                  <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div className="truncate text-sm font-medium">{editedReportTitle || report.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">Contents</Badge>
                      <Button variant="outline" size="sm" onClick={handleExportWord} className="rounded-full">
                        <Download className="mr-2 h-4 w-4" />
                        Share & Export
                      </Button>
                    </div>
                  </div>
                  <div className="sticky top-0 z-20 flex justify-center bg-white/90 px-4 pb-4 pt-3 backdrop-blur dark:bg-[#111318]/90">
                    <RichTextToolbar editor={reportEditor} disabled={!reportEditor && !activeReportSection} />
                  </div>
                  <EditableDocumentCanvas
                    html={reportDocumentHtml}
                    onEditorReady={setReportEditor}
                    onSectionFocus={setActiveReportSection}
                    surfaceClassName="rounded-none border-0 bg-transparent px-14 py-8 shadow-none"
                    onChange={(html) => {
                      const parsed = parseResearchDocumentHtml(html, report);
                      setEditedReportTitle(parsed.title);
                      setEditedExecutiveSummary(parsed.executiveSummaryPlain);
                      setEditedExecutiveSummaryRich(parsed.executiveSummaryRich);
                      setEditedReportSectionTitles(parsed.sectionTitles);
                      setEditedReportSections(parsed.sectionsPlain);
                      setEditedReportSectionsRich(parsed.sectionsRich);
                    }}
                  />
                </div>
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Complete status but report still loading
  if (session?.status === "complete" && !report) {
    return (
      <TooltipProvider>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">Loading Report...</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Your research is complete. Loading the report...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Error state
  if (session?.status === "error" || error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>

        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Research Failed</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {session?.error || error || "An unexpected error occurred during research."}
              </p>
              {renderCheckpointList(session?.graph_checkpoints)}
              <div className="mt-6 flex gap-2">
                {session?.graph_checkpoints && session.graph_checkpoints.length > 0 && (
                  <Button onClick={handleResumeResearch} disabled={isResuming}>
                    {isResuming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resuming...
                      </>
                    ) : (
                      "Resume Research"
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSession(null);
                    setError(null);
                    router.replace("/research");
                  }}
                >
                  Start New Research
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for unexpected states
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Chat
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Processing your request...
            </p>
            {session && (
              <p className="mt-2 text-xs text-muted-foreground">
                Status: {session.status} | Phase: {session.phase}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResearchPage() {
  // Require authentication - redirects to login if not authenticated
  const { canShowContent } = useRequireAuth();

  // Show loading while checking auth or redirecting
  if (!canShowContent) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <PageErrorBoundary fallback="generic">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-3xl px-4 py-8">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <FeatureGate
          feature="deep_research"
          requiredTier="professional"
          featureName="Deep Research"
        >
          <ResearchContent />
        </FeatureGate>
      </Suspense>
    </PageErrorBoundary>
  );
}
