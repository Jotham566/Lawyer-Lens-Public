import type { Document } from "@/lib/api/types";

/**
 * Resolve a display year for legislation cards.
 *
 * Some records miss `act_year` even though the year is recoverable from
 * publication/commencement dates, human-readable IDs, or title text.
 */
export function resolveDocumentYear(
  doc: Pick<Document, "act_year" | "publication_date" | "commencement_date" | "human_readable_id" | "title">
): string | null {
  if (doc.act_year) {
    return String(doc.act_year);
  }

  const dateYear = extractYearFromDate(doc.publication_date) || extractYearFromDate(doc.commencement_date);
  if (dateYear) {
    return dateYear;
  }

  const idYear = extractYear(doc.human_readable_id || "");
  if (idYear) {
    return idYear;
  }

  const titleYear = extractYear(doc.title || "");
  if (titleYear) {
    return titleYear;
  }

  return null;
}

function extractYearFromDate(value?: string): string | null {
  if (!value) {
    return null;
  }
  const match = /^((?:19|20)\d{2})-\d{2}-\d{2}$/.exec(value);
  return match ? match[1] : null;
}

function extractYear(value: string): string | null {
  const match = /\b(19|20)\d{2}\b/.exec(value);
  return match ? match[0] : null;
}

