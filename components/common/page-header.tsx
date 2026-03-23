"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Consistent page header component for all pages.
 * Follows enterprise design patterns with optional back navigation,
 * title, description, and action buttons.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "space-y-5 rounded-panel border border-border/60 bg-surface-container p-6 shadow-soft sm:p-8",
        className
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className={cn("mt-1 shrink-0", surfaceClasses.floatingIconButton)}
            >
              <Link href={backHref} aria-label={backLabel}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary-foreground/80">
              Workspace
            </p>
            <h1 className="mt-3 truncate font-serif text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-[2.5rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children ? <div className="border-t border-border/50 pt-5">{children}</div> : null}
    </div>
  );
}

interface PageHeaderActionsProps {
  children: React.ReactNode;
}

/**
 * Container for page header action buttons.
 * Use with PageHeader's actions prop for consistent styling.
 */
export function PageHeaderActions({ children }: PageHeaderActionsProps) {
  return <div className="flex items-center gap-2">{children}</div>;
}
