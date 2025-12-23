"use client";

import * as React from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatSource } from "@/lib/api/types";

type ExportFormat = "legal" | "academic" | "bibtex" | "bluebook" | "oscola";

interface CitationExportProps {
  source: ChatSource;
  /** Optional section reference to include */
  sectionRef?: string | null;
  className?: string;
}

/**
 * Formats a citation in legal style (e.g., Kenya Law format)
 */
function formatLegalCitation(source: ChatSource, sectionRef?: string | null): string {
  const parts: string[] = [];

  // Title with document type context
  if (source.document_type === "judgment") {
    parts.push(source.title);
  } else {
    parts.push(`${source.title}`);
  }

  // Section reference
  if (sectionRef) {
    parts.push(sectionRef);
  } else if (source.legal_reference) {
    parts.push(source.legal_reference);
  } else if (source.section) {
    parts.push(source.section);
  }

  // Human readable ID (case number, act number, etc.)
  if (source.human_readable_id && !parts.some(p => p.includes(source.human_readable_id))) {
    parts.push(`(${source.human_readable_id})`);
  }

  return parts.join(", ");
}

/**
 * Formats a citation in academic style (APA-like)
 */
function formatAcademicCitation(source: ChatSource, sectionRef?: string | null): string {
  const parts: string[] = [];

  // For judgments, try to extract year from human_readable_id
  let year = "";
  const yearMatch = source.human_readable_id?.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = yearMatch[0];
  }

  // Author/Court (for judgments) or title
  if (source.document_type === "judgment") {
    parts.push(source.title);
    if (year) {
      parts.push(`(${year})`);
    }
  } else {
    // Legislation
    parts.push(source.title);
    if (year) {
      parts.push(`(${year})`);
    }
  }

  // Case number or act reference
  if (source.human_readable_id) {
    parts.push(source.human_readable_id);
  }

  // Section reference
  if (sectionRef) {
    parts.push(sectionRef);
  } else if (source.legal_reference) {
    parts.push(source.legal_reference);
  }

  return parts.join(". ") + ".";
}

/**
 * Formats a citation in BibTeX format
 */
function formatBibTeXCitation(source: ChatSource, sectionRef?: string | null): string {
  // Generate a citation key
  const titleWords = source.title.split(/\s+/).slice(0, 2);
  const yearMatch = source.human_readable_id?.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "n.d.";
  const key = titleWords.join("").toLowerCase().replace(/[^a-z0-9]/g, "") + year;

  // Determine entry type
  const entryType = source.document_type === "judgment" ? "misc" : "legislation";

  const fields: string[] = [];
  fields.push(`  title = {${source.title}}`);

  if (source.human_readable_id) {
    fields.push(`  number = {${source.human_readable_id}}`);
  }

  if (year !== "n.d.") {
    fields.push(`  year = {${year}}`);
  }

  if (sectionRef || source.legal_reference) {
    fields.push(`  note = {${sectionRef || source.legal_reference}}`);
  }

  fields.push(`  howpublished = {Kenya Law}`);

  return `@${entryType}{${key},\n${fields.join(",\n")}\n}`;
}

/**
 * Formats a citation in Bluebook style (US legal citation)
 * Bluebook format: Title, Volume Source Page (Court Year).
 * For statutes: Title § Section (Year).
 */
function formatBluebookCitation(source: ChatSource, sectionRef?: string | null): string {
  const yearMatch = source.human_readable_id?.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "";

  if (source.document_type === "judgment") {
    // Case citation format: Case Name, Case Number (Court Year)
    const parts: string[] = [source.title];
    if (source.human_readable_id) {
      parts.push(source.human_readable_id);
    }
    if (year) {
      parts.push(`(${year})`);
    }
    return parts.join(", ");
  } else {
    // Statute citation format: Title § Section (Year)
    let citation = source.title;
    const section = sectionRef || source.legal_reference || source.section;
    if (section) {
      // Convert to Bluebook section symbol format
      const sectionNum = section.replace(/^(section|sec\.?)\s*/i, "");
      citation += ` § ${sectionNum}`;
    }
    if (year) {
      citation += ` (${year})`;
    }
    return citation;
  }
}

/**
 * Formats a citation in OSCOLA style (UK legal citation)
 * OSCOLA format for statutes: Title Year, section (if applicable)
 * OSCOLA format for cases: Case Name [Year] Court Reference
 */
function formatOSCOLACitation(source: ChatSource, sectionRef?: string | null): string {
  const yearMatch = source.human_readable_id?.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "";

  if (source.document_type === "judgment") {
    // Case citation format: Case Name [Year] Court Reference
    let citation = source.title;
    if (year) {
      citation += ` [${year}]`;
    }
    if (source.human_readable_id) {
      // Extract court abbreviation if present
      citation += ` ${source.human_readable_id.replace(/\s*\d{4}\s*/, " ").trim()}`;
    }
    return citation;
  } else {
    // Statute citation format: Title Year, s Section
    let citation = source.title;
    if (year && !citation.includes(year)) {
      citation += ` ${year}`;
    }
    const section = sectionRef || source.legal_reference || source.section;
    if (section) {
      // Convert to OSCOLA section format (s 1, s 2(1)(a), etc.)
      const sectionNum = section.replace(/^(section|sec\.?)\s*/i, "");
      citation += `, s ${sectionNum}`;
    }
    return citation;
  }
}

/**
 * Citation Export component - allows exporting citations in various formats
 */
export function CitationExport({ source, sectionRef, className }: CitationExportProps) {
  const [copied, setCopied] = React.useState(false);
  const [lastFormat, setLastFormat] = React.useState<ExportFormat | null>(null);

  const formatters: Record<ExportFormat, { label: string; format: () => string }> = {
    legal: {
      label: "Legal Citation",
      format: () => formatLegalCitation(source, sectionRef),
    },
    bluebook: {
      label: "Bluebook (US)",
      format: () => formatBluebookCitation(source, sectionRef),
    },
    oscola: {
      label: "OSCOLA (UK)",
      format: () => formatOSCOLACitation(source, sectionRef),
    },
    academic: {
      label: "Academic (APA)",
      format: () => formatAcademicCitation(source, sectionRef),
    },
    bibtex: {
      label: "BibTeX",
      format: () => formatBibTeXCitation(source, sectionRef),
    },
  };

  const handleExport = async (format: ExportFormat) => {
    const citation = formatters[format].format();
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setLastFormat(format);
    setTimeout(() => {
      setCopied(false);
      setLastFormat(null);
    }, 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Export</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.entries(formatters) as [ExportFormat, { label: string; format: () => string }][]).map(
          ([format, { label }]) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              className="text-sm cursor-pointer"
            >
              {label}
              {copied && lastFormat === format && (
                <Check className="h-3 w-3 ml-auto text-green-500" />
              )}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
