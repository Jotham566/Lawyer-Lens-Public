"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  compact?: boolean;
}

/**
 * Empty state component for lists, tables, and pages with no data.
 * Follows enterprise UX patterns with clear messaging and CTAs.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const ActionButton = action ? (
    action.href ? (
      <Button asChild>
        <a href={action.href}>{action.label}</a>
      </Button>
    ) : (
      <Button onClick={action.onClick}>{action.label}</Button>
    )
  ) : null;

  const SecondaryButton = secondaryAction ? (
    secondaryAction.href ? (
      <Button variant="outline" asChild>
        <a href={secondaryAction.href}>{secondaryAction.label}</a>
      </Button>
    ) : (
      <Button variant="outline" onClick={secondaryAction.onClick}>
        {secondaryAction.label}
      </Button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-12",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          compact ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            compact ? "h-6 w-6" : "h-8 w-8"
          )}
          aria-hidden="true"
        />
      </div>
      <h3
        className={cn(
          "font-medium text-foreground",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-sm",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}
      {(ActionButton || SecondaryButton) && (
        <div className={cn("flex gap-2", compact ? "mt-3" : "mt-4")}>
          {ActionButton}
          {SecondaryButton}
        </div>
      )}
    </div>
  );
}

/**
 * Empty state for search results.
 */
export function NoResultsState({
  query,
  onClearFilters,
  className,
}: {
  query?: string;
  onClearFilters?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-12", className)}>
      <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="font-medium text-foreground">No results found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {query
          ? `We couldn't find any matches for "${query}". Try different keywords or filters.`
          : "Try adjusting your search or filter criteria."}
      </p>
      {onClearFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
