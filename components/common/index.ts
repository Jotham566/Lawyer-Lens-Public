/**
 * Common reusable components following enterprise design patterns.
 * These components ensure consistency across the Law Lens platform.
 */

// Page structure
export { PageHeader, PageHeaderActions } from "./page-header";

// Feedback & alerts
export { AlertBanner, InlineAlert } from "./alert-banner";

// Empty & loading states
export { EmptyState, NoResultsState } from "./empty-state";
export {
  LoadingState,
  InlineLoading,
  PageLoading,
  CardSkeleton,
  TableRowSkeleton,
  ListSkeleton,
} from "./loading-state";

// Status indicators
export {
  StatusBadge,
  RoleBadge,
  TierBadge,
  DocumentTypeBadge,
} from "./status-badge";
