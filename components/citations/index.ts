/**
 * Citations Components Barrel Export
 *
 * Components for rendering interactive legal citations with hover previews.
 */

// Core citation components
export { CitationLink } from "./citation-link";
export { CitationText, useCitationParser } from "./citation-text";
export {
  SourceCitation,
  parseSourceCitations,
  type CitationSegment,
} from "./source-citation";
export { SourceDetailDialog } from "./source-detail-dialog";

// New enhanced citation system
export { CitationProvider, useCitation, useCitationOptional } from "./citation-context";
export { CitationHoverPreview } from "./citation-hover-preview";
export { SourcePanel } from "./source-panel";
export { SourceBottomSheet, ResponsiveSourceView } from "./source-bottom-sheet";
export { CitationNavigation, CitationNavigationHints } from "./citation-navigation";
export { HighlightedExcerpt, HighlightedExcerptCompact } from "./highlighted-excerpt";
