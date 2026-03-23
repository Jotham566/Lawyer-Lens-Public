import type { DocumentStatus } from "@/lib/api/knowledge-base";
import type { DocumentType } from "@/lib/api/types";

export const surfaceClasses = {
  pageHero: "ll-page-hero",
  pageEyebrow: "ll-page-eyebrow",
  pageIconTile: "ll-page-icon-tile",
  pagePanel: "ll-page-panel",
  pagePanelInteractive: "ll-page-panel-interactive",
  optionCard: "ll-option-card",
  optionCardActive: "ll-option-card ll-option-card-active",
  rowInteractive: "ll-row-interactive",
  rowInteractiveActive: "ll-row-interactive ll-row-interactive-active",
  navPillActive: "ll-nav-pill-active",
  sidebarNavButton: "ll-sidebar-nav-button",
  sidebarNavButtonActive: "ll-sidebar-nav-button ll-sidebar-nav-button-active",
  chipButton: "ll-chip-button",
  chipButtonActive: "ll-chip-button ll-chip-button-active",
  buttonSelected: "ll-button-selected",
  iconButton: "ll-icon-button",
  floatingIconButton: "ll-icon-button ll-icon-button-floating",
  iconButtonDanger: "ll-icon-button ll-icon-button-danger",
  avatarOverlayButton: "ll-avatar-overlay-button",
  dragHandleButton: "ll-drag-handle-button",
  textLink: "ll-text-link",
  searchField: "ll-search-field",
  chip: "ll-chip",
  chipMuted: "ll-chip-muted",
  floatingPanel: "ll-floating-panel",
  workspaceSidebar: "ll-workspace-sidebar",
  workspaceMain: "ll-workspace-main",
  workspaceInset: "ll-workspace-inset",
  workspaceCallout: "ll-workspace-callout",
  brandButton: "ll-cta-brand",
} as const;

export const sharedSurfaceClasses = surfaceClasses;

/* ───────────────────────────────────────────────────────────
   Typography — pre-composed classes that bake in font-family,
   size, weight, tracking, and color so pages/components never
   assemble these individually.
   ─────────────────────────────────────────────────────────── */
export const typographyClasses = {
  /** Display — hero stats, landing page headlines (Manrope) */
  displayLg: "ll-display-lg",
  displayMd: "ll-display-md",
  displaySm: "ll-display-sm",

  /** Headline — page titles, section headings (Manrope) */
  headingXl: "ll-heading-xl",
  headingLg: "ll-heading-lg",
  headingMd: "ll-heading-md",
  headingSm: "ll-heading-sm",

  /** Body — paragraph / prose text (Newsreader for lg/md, Manrope for sm) */
  bodyLg: "ll-body-lg",
  bodyMd: "ll-body-md",
  bodySm: "ll-body-sm",

  /** Label — metadata, status tags (Manrope, all-caps, tracked) */
  labelMd: "ll-label-md",
  labelSm: "ll-label-sm",
  labelXs: "ll-label-xs",
} as const;

/* ───────────────────────────────────────────────────────────
   Page layout — container, section, spacing patterns so every
   page gets the same widths, padding, and vertical rhythm.
   ─────────────────────────────────────────────────────────── */
export const layoutClasses = {
  /** Standard 6xl max-width page container */
  pageContainer: "ll-page-container",
  /** Narrow 3xl max-width (settings, forms) */
  pageContainerNarrow: "ll-page-container-narrow",
  /** Wide 7xl max-width (dashboards, browse) */
  pageContainerWide: "ll-page-container-wide",
  /** Vertical section with consistent spacing */
  pageSection: "ll-page-section",
} as const;

/* ───────────────────────────────────────────────────────────
   Transitions — standard durations for hover/focus animations.
   ─────────────────────────────────────────────────────────── */
export const transitionClasses = {
  /** Standard 200ms multi-property transition */
  base: "ll-transition",
  /** Fast 150ms for small interactive elements */
  fast: "ll-transition-fast",
  /** Slow 300ms for panels, overlays */
  slow: "ll-transition-slow",
  /** Micro-lift hover effect (-1px translateY) */
  hoverLift: "ll-hover-lift",
} as const;

/* ───────────────────────────────────────────────────────────
   Shadows — named shadow scale (maps to Tailwind boxShadow).
   ─────────────────────────────────────────────────────────── */
export const shadowClasses = {
  soft: "shadow-soft",
  floating: "shadow-floating",
  ambient: "shadow-ambient",
  none: "shadow-none",
} as const;

export type ToneName = "success" | "info" | "warning" | "neutral" | "danger";
export type RelevanceLevel = "high" | "medium" | "low";

export function getRelevanceLevel(score: number): RelevanceLevel {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

const relevanceThemes = {
  high: {
    label: "High relevance",
    pill: "ll-status-pill-high",
    badge: "ll-status-badge-high",
    dot: "ll-status-dot-high",
    text: "ll-status-text-high",
    bar: "ll-status-bar-high",
    compact: "ll-status-compact-high",
  },
  medium: {
    label: "Medium relevance",
    pill: "ll-status-pill-medium",
    badge: "ll-status-badge-medium",
    dot: "ll-status-dot-medium",
    text: "ll-status-text-medium",
    bar: "ll-status-bar-medium",
    compact: "ll-status-compact-medium",
  },
  low: {
    label: "Low relevance",
    pill: "ll-status-pill-low",
    badge: "ll-status-badge-low",
    dot: "ll-status-dot-low",
    text: "ll-status-text-low",
    bar: "ll-status-bar-low",
    compact: "ll-status-compact-low",
  },
} as const;

const toneStyles: Record<
  ToneName,
  {
    badgeVariant: "success" | "info" | "warning" | "neutral" | "danger";
    surface: string;
    text: string;
    icon: string;
    bar: string;
    dot: string;
  }
> = {
  success: {
    badgeVariant: "success",
    surface: "tone-success",
    text: "ll-status-text-high",
    icon: "ll-verification-verified-icon",
    bar: "ll-status-bar-high",
    dot: "ll-status-dot-high",
  },
  info: {
    badgeVariant: "info",
    surface: "tone-info",
    text: "ll-status-text-reviewed",
    icon: "ll-verification-partial-icon",
    bar: "ll-status-bar-reviewed",
    dot: "ll-status-dot-medium",
  },
  warning: {
    badgeVariant: "warning",
    surface: "tone-warning",
    text: "ll-status-text-medium",
    icon: "ll-verification-analyzing-icon",
    bar: "ll-status-bar-medium",
    dot: "ll-status-dot-medium",
  },
  neutral: {
    badgeVariant: "neutral",
    surface: "tone-neutral",
    text: "ll-status-text-neutral",
    icon: "ll-verification-review-icon",
    bar: "ll-status-bar-neutral",
    dot: "ll-status-dot-neutral",
  },
  danger: {
    badgeVariant: "danger",
    surface: "tone-danger",
    text: "text-destructive",
    icon: "text-destructive",
    bar: "bg-destructive",
    dot: "bg-destructive",
  },
};

const documentThemes: Record<
  DocumentType,
  { badge: "act" | "judgment" | "regulation" | "constitution"; accent: string }
> = {
  act: {
    badge: "act",
    accent: "ll-doc-accent-act",
  },
  judgment: {
    badge: "judgment",
    accent: "ll-doc-accent-judgment",
  },
  regulation: {
    badge: "regulation",
    accent: "ll-doc-accent-regulation",
  },
  constitution: {
    badge: "constitution",
    accent: "ll-doc-accent-constitution",
  },
};

const verificationThemes = {
  verified: {
    container: "ll-verification-verified",
    icon: "ll-verification-verified-icon",
    label: "Verified",
    animate: false,
  },
  partially_verified: {
    container: "ll-verification-partial",
    icon: "ll-verification-partial-icon",
    label: "Mostly Verified",
    animate: false,
  },
  analyzing: {
    container: "ll-verification-analyzing",
    icon: "ll-verification-analyzing-icon",
    label: "Analyzing Sources...",
    animate: true,
  },
  unverified: {
    container: "ll-verification-review",
    icon: "ll-verification-review-icon",
    label: "Review Suggested",
    animate: false,
  },
} as const;

const confidenceThemes = {
  high: {
    label: "High Confidence",
    text: "ll-status-text-high",
    bar: "ll-status-bar-high",
  },
  good: {
    label: "Good Confidence",
    text: "ll-status-text-reviewed",
    bar: "ll-status-bar-reviewed",
  },
  moderate: {
    label: "Moderate Confidence",
    text: "ll-status-text-neutral",
    bar: "ll-status-bar-neutral",
  },
} as const;

const subscriptionTierThemes = {
  free: "ll-tier-free",
  professional: "ll-tier-professional",
  team: "ll-tier-team",
  enterprise: "ll-tier-enterprise",
} as const;

export function getToneStyles(tone: ToneName) {
  return toneStyles[tone];
}

export function getRelevanceTheme(score: number) {
  return relevanceThemes[getRelevanceLevel(score)];
}

export function getRelevanceTone(score: number): ToneName {
  const level = getRelevanceLevel(score);
  if (level === "high") return "success";
  if (level === "medium") return "warning";
  return "info";
}

export function getDocumentTheme(type: DocumentType) {
  return documentThemes[type] ?? documentThemes.act;
}

export function getDocumentBadgeVariant(type: DocumentType) {
  return getDocumentTheme(type).badge;
}

export function getDocumentAccentClass(type: DocumentType) {
  switch (type) {
    case "act":
      return "text-primary";
    case "judgment":
      return "ll-status-text-reviewed";
    case "regulation":
      return "ll-status-text-high";
    case "constitution":
      return "ll-status-text-medium";
    default:
      return "text-muted-foreground";
  }
}

export function getDocumentRailClass(type: DocumentType) {
  return getDocumentTheme(type).accent;
}

export function getDocumentFileTypeClass(fileType: string) {
  const normalized = fileType.toLowerCase();

  if (normalized.includes("pdf")) return "text-primary";
  if (normalized.includes("doc")) return "ll-status-text-reviewed";
  if (normalized.includes("xls") || normalized.includes("csv")) return "ll-status-text-medium";
  if (normalized.includes("txt") || normalized.includes("md")) return "ll-status-text-neutral";
  return "text-primary";
}

export function getDocumentStatusTone(status: DocumentStatus): ToneName {
  switch (status) {
    case "ready":
      return "success";
    case "processing":
      return "info";
    case "uploaded":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function getVerificationTone(level?: string): ToneName {
  switch (level) {
    case "verified":
      return "success";
    case "partially_verified":
      return "info";
    case "analyzing":
      return "warning";
    default:
      return "neutral";
  }
}

export function getVerificationTheme(level?: string) {
  switch (level) {
    case "verified":
      return verificationThemes.verified;
    case "partially_verified":
      return verificationThemes.partially_verified;
    case "analyzing":
      return verificationThemes.analyzing;
    default:
      return verificationThemes.unverified;
  }
}

export function getConfidenceTone(level?: string): ToneName {
  switch (level) {
    case "high":
      return "success";
    case "good":
      return "info";
    default:
      return "neutral";
  }
}

export function getConfidenceTheme(level?: string) {
  switch (level) {
    case "high":
      return confidenceThemes.high;
    case "good":
      return confidenceThemes.good;
    default:
      return confidenceThemes.moderate;
  }
}

export function getSubscriptionTierTheme(tier?: string) {
  switch (tier) {
    case "professional":
      return subscriptionTierThemes.professional;
    case "team":
      return subscriptionTierThemes.team;
    case "enterprise":
      return subscriptionTierThemes.enterprise;
    default:
      return subscriptionTierThemes.free;
  }
}
