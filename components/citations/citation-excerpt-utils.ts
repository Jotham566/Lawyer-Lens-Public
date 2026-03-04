import type { ChatSource, HierarchyPathItem } from "@/lib/api/types";

export interface ParsedExcerptTable {
  headers: string[];
  rows: string[][];
}

export interface ParsedCitationExcerpt {
  hierarchyLabel: string | null;
  bodyText: string;
  tables: ParsedExcerptTable[];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const codePoint = Number.parseInt(code, 10);
      return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : "";
    });
}

function stripHtml(value: string): string {
  const withBreaks = value.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(noTags)
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseHtmlTable(htmlTable: string): ParsedExcerptTable | null {
  const rowMatches = htmlTable.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi);
  if (!rowMatches || rowMatches.length === 0) return null;

  const parsedRows = rowMatches
    .map((rowHtml) => {
      const cellMatches = rowHtml.match(/<t[hd]\b[^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
      return cellMatches
        .map((cellHtml) => stripHtml(cellHtml))
        .filter((cell) => cell.length > 0);
    })
    .filter((cells) => cells.length > 0);

  if (parsedRows.length < 2) return null;

  const headers = parsedRows[0];
  const rows = parsedRows.slice(1);

  if (headers.length === 0 || rows.length === 0) return null;

  return { headers, rows };
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitColumns(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatHierarchyItem(item: HierarchyPathItem): string {
  const identifier = item.identifier?.trim();
  const title = item.title?.trim();
  const typeLabel = item.type
    ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
    : "";
  const head = [typeLabel, identifier].filter(Boolean).join(" ").trim();
  if (!title) return head;
  if (!head) return title;
  if (head.toLowerCase().includes(title.toLowerCase())) return head;
  return `${head}: ${title}`;
}

function parseRowFromLine(line: string, headers: string[]): string[] | null {
  const values = new Array(headers.length).fill("");
  const segments = line
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let consumed = false;
  for (const segment of segments) {
    const idx = segment.indexOf(":");
    if (idx < 0) {
      if (!values[0]) values[0] = segment;
      else values[0] = `${values[0]}; ${segment}`;
      continue;
    }

    const key = segment.slice(0, idx).trim();
    const value = segment.slice(idx + 1).trim();
    if (!value) continue;

    const normalizedKey = normalizeKey(key);
    const headerIndex = headers.findIndex((header) => {
      const normalizedHeader = normalizeKey(header);
      return (
        normalizedKey === normalizedHeader ||
        normalizedKey.includes(normalizedHeader) ||
        normalizedHeader.includes(normalizedKey)
      );
    });

    if (headerIndex >= 0) {
      consumed = true;
      values[headerIndex] = values[headerIndex]
        ? `${values[headerIndex]}; ${value}`
        : value;
      continue;
    }

    // Unknown key/value pair - keep in the first column so information is not lost.
    values[0] = values[0] ? `${values[0]}; ${segment}` : segment;
  }

  if (!consumed && !values[0]) return null;
  if (values.every((value) => !value.trim())) return null;
  return values;
}

export function buildHierarchyPath(
  source: ChatSource,
  fallbackPath: HierarchyPathItem[] = []
): string[] {
  const preferred = source.hierarchy_path && source.hierarchy_path.length > 0
    ? source.hierarchy_path
    : fallbackPath;
  if (!preferred || preferred.length === 0) return [];
  return preferred.map(formatHierarchyItem).filter(Boolean);
}

export function parseCitationExcerpt(excerpt: string): ParsedCitationExcerpt {
  const normalized = excerpt.replace(/\r\n/g, "\n").trim();
  const bracketMatch = normalized.match(/^\s*\[([^\]]+)\]\s*/);
  const hierarchyLabel = bracketMatch?.[1]?.trim() || null;
  let withoutHeading = bracketMatch
    ? normalized.slice(bracketMatch[0].length).trim()
    : normalized;

  const tables: ParsedExcerptTable[] = [];
  const tableBlocks = withoutHeading.match(/<table\b[\s\S]*?<\/table>/gi) || [];
  for (const tableBlock of tableBlocks) {
    const parsedTable = parseHtmlTable(tableBlock);
    if (parsedTable) tables.push(parsedTable);
  }
  withoutHeading = withoutHeading.replace(/<table\b[\s\S]*?<\/table>/gi, " ");

  if (/<tr\b/i.test(withoutHeading) && /<t[hd]\b/i.test(withoutHeading)) {
    const looseRows = withoutHeading.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
    if (looseRows.length > 0) {
      const parsedLoose = parseHtmlTable(`<table>${looseRows.join("")}</table>`);
      if (parsedLoose) tables.push(parsedLoose);
      withoutHeading = withoutHeading.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi, " ");
    }
  }

  withoutHeading = stripHtml(withoutHeading);

  const lines = withoutHeading
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bodyLines: string[] = [];
  let activeTable: ParsedExcerptTable | null = null;

  const flushTable = () => {
    if (!activeTable) return;
    if (activeTable.headers.length > 0 && activeTable.rows.length > 0) {
      tables.push(activeTable);
    }
    activeTable = null;
  };

  for (const line of lines) {
    const columnsMatch = line.match(/^table columns?\s*:\s*(.+)$/i);
    if (columnsMatch) {
      flushTable();
      const headers = splitColumns(columnsMatch[1]);
      if (headers.length > 0) {
        activeTable = { headers, rows: [] };
      }
      continue;
    }

    if (activeTable) {
      const row = parseRowFromLine(line, activeTable.headers);
      if (row) {
        activeTable.rows.push(row);
        continue;
      }
      flushTable();
    }

    bodyLines.push(line);
  }

  flushTable();

  return {
    hierarchyLabel,
    bodyText: bodyLines.join("\n\n").trim(),
    tables,
  };
}
