/**
 * Citation Parser Utility
 *
 * Parses legal citation patterns and converts them to AKN eIds for section lookup.
 * Supports various citation formats commonly found in Ugandan legal documents.
 */

export interface ParsedCitation {
  /** Original matched text */
  text: string;
  /** Generated AKN eId */
  eId: string;
  /** Type of citation (section, article, regulation, etc.) */
  type: "section" | "article" | "regulation" | "part" | "chapter" | "schedule";
  /** Section/article number */
  number: string;
  /** Optional subsection (e.g., "2" from "19(2)") */
  subsection?: string;
  /** Optional paragraph (e.g., "a" from "19(2)(a)") */
  paragraph?: string;
  /** Optional subparagraph (e.g., "i" from "19(2)(a)(i)") */
  subparagraph?: string;
  /** Start index in original text */
  start: number;
  /** End index in original text */
  end: number;
}

/**
 * Citation patterns with regex and type mapping
 */
const CITATION_PATTERNS = [
  // Full section with subsection, paragraph, subparagraph: "Section 19(2)(a)(i)" or "s. 19(2)(a)(i)"
  {
    pattern:
      /\b(?:(?:[Ss]ection|[Ss]ec\.?|[Ss]\.))\s*(\d+)\s*\((\d+)\)\s*\(([a-z])\)\s*\(([ivxlcdm]+)\)/g,
    type: "section" as const,
    groups: ["number", "subsection", "paragraph", "subparagraph"],
  },
  // Section with subsection and paragraph: "Section 19(2)(a)" or "s. 19(2)(a)"
  {
    pattern:
      /\b(?:(?:[Ss]ection|[Ss]ec\.?|[Ss]\.))\s*(\d+)\s*\((\d+)\)\s*\(([a-z])\)/g,
    type: "section" as const,
    groups: ["number", "subsection", "paragraph"],
  },
  // Section with subsection: "Section 19(2)" or "s. 19(2)"
  {
    pattern: /\b(?:(?:[Ss]ection|[Ss]ec\.?|[Ss]\.))\s*(\d+)\s*\((\d+)\)/g,
    type: "section" as const,
    groups: ["number", "subsection"],
  },
  // Simple section: "Section 19" or "s. 19"
  {
    pattern: /\b(?:(?:[Ss]ection|[Ss]ec\.?|[Ss]\.))\s*(\d+)\b/g,
    type: "section" as const,
    groups: ["number"],
  },
  // Bare citation with subsection and paragraph: "19(2)(a)(i)"
  {
    pattern: /\b(\d+)\s*\((\d+)\)\s*\(([a-z])\)\s*\(([ivxlcdm]+)\)/g,
    type: "section" as const,
    groups: ["number", "subsection", "paragraph", "subparagraph"],
  },
  // Bare citation with subsection and paragraph: "19(2)(a)"
  {
    pattern: /\b(\d+)\s*\((\d+)\)\s*\(([a-z])\)/g,
    type: "section" as const,
    groups: ["number", "subsection", "paragraph"],
  },
  // Bare citation with subsection: "19(2)"
  {
    pattern: /\b(\d+)\s*\((\d+)\)/g,
    type: "section" as const,
    groups: ["number", "subsection"],
  },
  // Article patterns (for constitutional provisions)
  {
    pattern:
      /\b(?:[Aa]rticle|[Aa]rt\.?)\s*(\d+)\s*\((\d+)\)\s*\(([a-z])\)/g,
    type: "article" as const,
    groups: ["number", "subsection", "paragraph"],
  },
  {
    pattern: /\b(?:[Aa]rticle|[Aa]rt\.?)\s*(\d+)\s*\((\d+)\)/g,
    type: "article" as const,
    groups: ["number", "subsection"],
  },
  {
    pattern: /\b(?:[Aa]rticle|[Aa]rt\.?)\s*(\d+)\b/g,
    type: "article" as const,
    groups: ["number"],
  },
  // Regulation patterns
  {
    pattern: /\b[Rr]egulation\s*(\d+)\s*\((\d+)\)/g,
    type: "regulation" as const,
    groups: ["number", "subsection"],
  },
  {
    pattern: /\b[Rr]egulation\s*(\d+)\b/g,
    type: "regulation" as const,
    groups: ["number"],
  },
  // Part/Chapter (structural)
  {
    pattern: /\b[Pp]art\s+([IVXLCDM]+|\d+)\b/g,
    type: "part" as const,
    groups: ["number"],
  },
  {
    pattern: /\b[Cc]hapter\s+([IVXLCDM]+|\d+)\b/g,
    type: "chapter" as const,
    groups: ["number"],
  },
];

/**
 * Element type prefixes for eId generation (matching AKN conventions)
 */
const EID_PREFIXES: Record<string, string> = {
  section: "sec",
  article: "art",
  regulation: "reg",
  part: "part",
  chapter: "chp",
  schedule: "schedule",
  subsection: "subsec",
  paragraph: "para",
  subparagraph: "subpara",
};

/**
 * Convert Roman numerals to Arabic numbers
 */
function romanToArabic(roman: string): number {
  const romanValues: Record<string, number> = {
    i: 1,
    v: 5,
    x: 10,
    l: 50,
    c: 100,
    d: 500,
    m: 1000,
  };

  let result = 0;
  const lowerRoman = roman.toLowerCase();

  for (let i = 0; i < lowerRoman.length; i++) {
    const current = romanValues[lowerRoman[i]];
    const next = romanValues[lowerRoman[i + 1]];

    if (next && current < next) {
      result -= current;
    } else {
      result += current;
    }
  }

  return result;
}

/**
 * Check if a string is a Roman numeral
 */
function isRomanNumeral(str: string): boolean {
  return /^[ivxlcdm]+$/i.test(str);
}

/**
 * Generate AKN eId from parsed citation parts
 */
function generateEId(
  type: string,
  number: string,
  subsection?: string,
  paragraph?: string,
  subparagraph?: string
): string {
  const parts: string[] = [];

  // Main element (section, article, etc.)
  const prefix = EID_PREFIXES[type] || type;
  const normalizedNumber = isRomanNumeral(number)
    ? romanToArabic(number).toString()
    : number;
  parts.push(`${prefix}_${normalizedNumber}`);

  // Subsection
  if (subsection) {
    parts.push(`${EID_PREFIXES.subsection}_${subsection}`);
  }

  // Paragraph
  if (paragraph) {
    parts.push(`${EID_PREFIXES.paragraph}_${paragraph}`);
  }

  // Subparagraph
  if (subparagraph) {
    const normalizedSubpara = isRomanNumeral(subparagraph)
      ? romanToArabic(subparagraph).toString()
      : subparagraph;
    parts.push(`${EID_PREFIXES.subparagraph}_${normalizedSubpara}`);
  }

  return parts.join("__");
}

/**
 * Parse a string and extract all citations
 *
 * @param text - The text to parse for citations
 * @returns Array of parsed citations with their eIds and positions
 */
export function parseCitations(text: string): ParsedCitation[] {
  const citations: ParsedCitation[] = [];
  const seen = new Set<string>(); // Track seen positions to avoid duplicates

  for (const { pattern, type, groups } of CITATION_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const posKey = `${match.index}-${match.index + match[0].length}`;

      // Skip if we've already found a citation at this position
      // (longer patterns should be checked first to get most specific match)
      let overlaps = false;
      for (const existing of citations) {
        if (
          (match.index >= existing.start && match.index < existing.end) ||
          (match.index + match[0].length > existing.start &&
            match.index + match[0].length <= existing.end)
        ) {
          overlaps = true;
          break;
        }
      }

      if (overlaps || seen.has(posKey)) {
        continue;
      }

      seen.add(posKey);

      // Extract groups based on pattern definition
      const values: Record<string, string> = {};
      groups.forEach((groupName, index) => {
        values[groupName] = match![index + 1];
      });

      const citation: ParsedCitation = {
        text: match[0],
        type,
        number: values.number,
        subsection: values.subsection,
        paragraph: values.paragraph,
        subparagraph: values.subparagraph,
        start: match.index,
        end: match.index + match[0].length,
        eId: generateEId(
          type,
          values.number,
          values.subsection,
          values.paragraph,
          values.subparagraph
        ),
      };

      citations.push(citation);
    }
  }

  // Sort by position in text
  citations.sort((a, b) => a.start - b.start);

  return citations;
}

/**
 * Convert a simple citation string to an eId
 *
 * @param citation - Citation string like "Section 19(2)(a)"
 * @returns The eId string or null if not parseable
 */
export function citationToEId(citation: string): string | null {
  const parsed = parseCitations(citation);
  return parsed.length > 0 ? parsed[0].eId : null;
}

/**
 * Convert an eId back to a human-readable citation
 *
 * @param eId - AKN eId like "sec_19__subsec_2__para_a"
 * @returns Human-readable citation like "Section 19(2)(a)"
 */
export function eIdToCitation(eId: string): string {
  const parts = eId.split("__");
  const result: string[] = [];

  for (const part of parts) {
    const [prefix, value] = part.split("_");

    switch (prefix) {
      case "sec":
        result.push(`Section ${value}`);
        break;
      case "art":
        result.push(`Article ${value}`);
        break;
      case "reg":
        result.push(`Regulation ${value}`);
        break;
      case "part":
        result.push(`Part ${value}`);
        break;
      case "chp":
        result.push(`Chapter ${value}`);
        break;
      case "subsec":
        result.push(`(${value})`);
        break;
      case "para":
        result.push(`(${value})`);
        break;
      case "subpara":
        result.push(`(${value})`);
        break;
      default:
        result.push(part);
    }
  }

  // Join with appropriate formatting
  // "Section 19" + "(2)" + "(a)" = "Section 19(2)(a)"
  let formatted = "";
  for (const part of result) {
    if (part.startsWith("(")) {
      formatted += part;
    } else if (formatted) {
      formatted += " " + part;
    } else {
      formatted = part;
    }
  }

  return formatted || eId;
}

/**
 * Check if a string contains any parseable citations
 */
export function hasCitations(text: string): boolean {
  return parseCitations(text).length > 0;
}

/**
 * Extract unique eIds from text
 */
export function extractUniqueEIds(text: string): string[] {
  const citations = parseCitations(text);
  return [...new Set(citations.map((c) => c.eId))];
}
