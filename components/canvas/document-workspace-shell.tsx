"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentWorkspaceShellProps {
  backHref?: string;
  backLabel?: string;
  title: string;
  titleIcon?: ReactNode;
  titleBadge?: ReactNode;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  sidebarClassName?: string;
  mainClassName?: string;
}

interface DocumentPanelProps {
  title: string;
  titleIcon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function DocumentWorkspaceShell({
  backHref = "/chat",
  backLabel = "Back to Chat",
  title,
  titleIcon,
  titleBadge,
  headerMeta,
  headerActions,
  sidebar,
  children,
  sidebarClassName,
  mainClassName,
}: DocumentWorkspaceShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/88 px-4 shadow-soft backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={backHref}
            className="ll-link-muted inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
            {titleIcon}
            <span className="max-w-[200px] truncate sm:max-w-[400px]">{title}</span>
            {titleBadge}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {headerMeta}
          {headerActions}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebar ? (
          <aside
            className={cn(
              "ll-workspace-sidebar hidden shrink-0 border-r border-border/40 lg:flex lg:flex-col lg:overflow-y-auto",
              sidebarClassName,
            )}
          >
            {sidebar}
          </aside>
        ) : null}

        <main className={cn("ll-workspace-main flex-1 overflow-y-auto", mainClassName)}>{children}</main>
      </div>
    </div>
  );
}

export function DocumentPanel({
  title,
  titleIcon,
  badge,
  actions,
  toolbar,
  children,
  className,
  bodyClassName,
}: DocumentPanelProps) {
  return (
    <div
      className={cn(
        "ll-surface-panel rounded-panel",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/30 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {titleIcon}
          <div className="truncate text-sm font-medium">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          {badge ?? <Badge variant="secondary" className="rounded-full">Workspace</Badge>}
          {actions}
        </div>
      </div>
      {toolbar ? (
        <div className="sticky top-0 z-20 flex justify-center bg-card/90 px-4 pb-4 pt-3 backdrop-blur">
          {toolbar}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
