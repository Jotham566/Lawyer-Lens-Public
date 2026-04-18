"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSearch,
  FileText,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertBanner, EmptyState } from "@/components/common";
import {
  deleteResearchSession,
  getMyResearchSessions,
  type ResearchSessionListItem,
  type ResearchStatus,
} from "@/lib/api/research";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "complete" | "in_progress";

const statusConfig: Record<
  ResearchStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle2 }
> = {
  created: { label: "Created", variant: "secondary", icon: Clock },
  clarifying: { label: "Clarifying", variant: "secondary", icon: Clock },
  brief_review: { label: "Review", variant: "secondary", icon: Clock },
  researching: { label: "Researching", variant: "default", icon: Loader2 },
  writing: { label: "Writing", variant: "default", icon: Loader2 },
  complete: { label: "Complete", variant: "outline", icon: CheckCircle2 },
  error: { label: "Failed", variant: "destructive", icon: AlertCircle },
  redirect_to_chat: { label: "Chat", variant: "secondary", icon: ChevronRight },
  redirect_to_contract: { label: "Contract", variant: "secondary", icon: ChevronRight },
};

const IN_PROGRESS_STATUSES = new Set<ResearchStatus>([
  "clarifying",
  "brief_review",
  "researching",
  "writing",
]);

function SessionCard({
  session,
  onDelete,
}: {
  session: ResearchSessionListItem;
  onDelete: (id: string) => void;
}) {
  const config = statusConfig[session.status] || statusConfig.created;
  const StatusIcon = config.icon;
  const isActive = IN_PROGRESS_STATUSES.has(session.status);
  const displayTitle = session.title?.trim() || session.query.slice(0, 80);

  return (
    <Card className={cn("group", surfaceClasses.pagePanelInteractive)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/research?session=${session.session_id}`}
              className="block truncate rounded text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open research session: ${displayTitle}`}
            >
              {displayTitle}
            </Link>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {session.query}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={config.variant} className="h-5 px-2 text-xs">
                <StatusIcon
                  className={`mr-1 h-3 w-3 ${isActive ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {config.label}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatDistanceToNow(
                  new Date(session.completed_at || session.updated_at || session.created_at),
                  { addSuffix: true }
                )}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="ll-icon-button ll-icon-button-danger h-8 w-8"
              onClick={() => onDelete(session.session_id)}
              aria-label={`Delete session: ${displayTitle}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResearchHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ResearchSessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const tabRefs = useRef<Record<FilterKey, HTMLButtonElement | null>>({
    all: null,
    complete: null,
    in_progress: null,
  });

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getMyResearchSessions({ limit: 100 });
      setSessions(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load research history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const filteredSessions = sessions.filter((s) => {
    if (filter === "complete" && s.status !== "complete") return false;
    if (filter === "in_progress" && !IN_PROGRESS_STATUSES.has(s.status)) return false;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const haystack = `${s.title || ""} ${s.query}`.toLowerCase();
      return haystack.includes(needle);
    }
    return true;
  });

  const tabKeys: FilterKey[] = ["all", "complete", "in_progress"];
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const idx = tabKeys.indexOf(filter);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabKeys.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabKeys.length) % tabKeys.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabKeys.length - 1;
    else return;
    e.preventDefault();
    const nextKey = tabKeys[next]!;
    setFilter(nextKey);
    tabRefs.current[nextKey]?.focus();
  };

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const target = deleteId;
    setDeleteId(null);
    try {
      await deleteResearchSession(target);
      setSessions((prev) => prev.filter((s) => s.session_id !== target));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
    }
  };

  const counts = {
    all: sessions.length,
    complete: sessions.filter((s) => s.status === "complete").length,
    in_progress: sessions.filter((s) => IN_PROGRESS_STATUSES.has(s.status)).length,
  };

  return (
    <div className="min-h-screen px-6 py-6 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Research History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage your past deep research sessions
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/research")}>
            New Research
          </Button>
        </div>

        {error ? (
          <AlertBanner variant="error" message={error} className="mb-6" />
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Search}
              title="No Research Sessions"
              description="Start your first deep research session to see it here."
              action={{
                label: "Start Research",
                onClick: () => router.push("/research"),
              }}
            />
          </div>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Filter research sessions"
              className="mb-4 mt-6 flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { key: "all" as const, label: "All", count: counts.all },
                  { key: "complete" as const, label: "Complete", count: counts.complete },
                  { key: "in_progress" as const, label: "In Progress", count: counts.in_progress },
                ]
              ).map((tab) => {
                const selected = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    ref={(el) => {
                      tabRefs.current[tab.key] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setFilter(tab.key)}
                    onKeyDown={handleTabKeyDown}
                    className={cn(
                      "ll-transition rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or query"
                  className="pl-9"
                  aria-label="Search research sessions"
                />
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  icon={FileSearch}
                  title="No matches"
                  description={
                    filter === "complete"
                      ? "No completed sessions match your search."
                      : filter === "in_progress"
                        ? "No in-progress sessions match your search."
                        : "No sessions match your search."
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <SessionCard
                    key={session.session_id}
                    session={session}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete research session?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the session and its report from
                the server. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} variant="destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
