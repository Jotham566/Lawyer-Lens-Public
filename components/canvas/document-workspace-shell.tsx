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
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="hidden h-5 w-px bg-border sm:block" />
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
              "hidden shrink-0 border-r bg-background/95 lg:flex lg:flex-col lg:overflow-y-auto",
              sidebarClassName,
            )}
          >
            {sidebar}
          </aside>
        ) : null}

        <main className={cn("flex-1 overflow-y-auto", mainClassName)}>{children}</main>
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
        "rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]",
        "dark:border-white/10 dark:bg-[#111318] dark:shadow-[0_24px_80px_-48px_rgba(0,0,0,0.75)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3 dark:border-white/10">
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
        <div className="sticky top-0 z-20 flex justify-center bg-white/90 px-4 pb-4 pt-3 backdrop-blur dark:bg-[#111318]/90">
          {toolbar}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
