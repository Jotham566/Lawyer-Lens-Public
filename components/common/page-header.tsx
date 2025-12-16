"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={backHref} aria-label={backLabel}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {children}
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
