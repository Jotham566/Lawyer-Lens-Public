"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Clock,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  Check,
} from "lucide-react";
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
import {
  EmptyState,
  AlertBanner,
} from "@/components/common";
import {
  useResearchSessionsStore,
  type ResearchSessionSummary,
} from "@/lib/stores";
import type { ResearchStatus } from "@/lib/api/research";
import { formatDistanceToNow } from "date-fns";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

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

function SessionCard({
  session,
  onDelete,
  onRename,
}: {
  session: ResearchSessionSummary;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const config = statusConfig[session.status] || statusConfig.created;
  const StatusIcon = config.icon;
  const isActive = ["clarifying", "brief_review", "researching", "writing"].includes(
    session.status
  );

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(session.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  // Card is now an anchor: keyboard-focusable + screen-reader announces
  // it as a link instead of a div with an onClick. Edit/delete buttons
  // sit alongside the link (not nested inside it — nesting interactive
  // elements is invalid HTML and breaks AT focus order).
  return (
    <Card className={cn("group", surfaceClasses.pagePanelInteractive)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 text-sm"
                    autoFocus
                    aria-label={`Rename session: ${session.title}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSaveTitle}
                    aria-label="Save title"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditTitle(session.title);
                      setIsEditing(false);
                    }}
                    aria-label="Cancel rename"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <>
                  <Link
                    href={`/research?session=${session.id}`}
                    className="font-medium text-sm truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label={`Open research session: ${session.title}`}
                  >
                    {session.title}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => setIsEditing(true)}
                    aria-label={`Rename session: ${session.title}`}
                  >
                    <Edit2 className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {session.query}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={config.variant} className="h-5 px-2 text-xs">
                <StatusIcon
                  className={`h-3 w-3 mr-1 ${isActive ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {config.label}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatDistanceToNow(new Date(session.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="ll-icon-button ll-icon-button-danger h-8 w-8"
              onClick={() => onDelete(session.id)}
              aria-label={`Delete session: ${session.title}`}
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

type FilterKey = "all" | "complete" | "in_progress";

export default function ResearchHistoryPage() {
  const router = useRouter();
  const { sessions, removeSession, renameSession, clearSessions } =
    useResearchSessionsStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const tabRefs = useRef<Record<FilterKey, HTMLButtonElement | null>>({
    all: null,
    complete: null,
    in_progress: null,
  });

  const filteredSessions = sessions.filter((s) => {
    if (filter === "complete") return s.status === "complete";
    if (filter === "in_progress")
      return ["clarifying", "brief_review", "researching", "writing"].includes(
        s.status
      );
    return true;
  });

  const tabKeys: FilterKey[] = ["all", "complete", "in_progress"];

  // ARIA Authoring Practices: tablist supports arrow-key navigation.
  // Left/Right wrap horizontally; Home/End jump to ends.
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

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      removeSession(deleteId);
      setDeleteId(null);
    }
  };

  const handleClearAll = () => {
    clearSessions();
    setShowClearDialog(false);
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
        <div className="flex items-center gap-3">
          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
            >
              Clear All
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => router.push("/research")}
          >
            New Research
          </Button>
        </div>
      </div>

      {sessions.length === 0 ? (
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
          {/* Filter Tabs — full ARIA tablist semantics: role="tablist"
              with role="tab" + aria-selected on each, plus arrow-key
              navigation per WAI-ARIA Authoring Practices. */}
          <div
            role="tablist"
            aria-label="Filter research sessions"
            className="flex flex-wrap items-center gap-2 mb-6 mt-6"
          >
            {([
              { key: "all" as const, label: "All", count: sessions.length },
              { key: "complete" as const, label: "Complete", count: sessions.filter((s) => s.status === "complete").length },
              { key: "in_progress" as const, label: "In Progress", count: sessions.filter((s) => ["clarifying", "brief_review", "researching", "writing"].includes(s.status)).length },
            ]).map((tab) => {
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

          {filteredSessions.length === 0 ? (
            <AlertBanner
              variant="info"
              message={`No ${
                filter === "complete" ? "completed" : "in-progress"
              } sessions found.`}
            />
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div key={session.id} className="group">
                  <SessionCard
                    session={session}
                    onDelete={handleDelete}
                    onRename={renameSession}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Session Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Research Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the session from your history. The research data
              may still be available on the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all sessions from your local history. The
              research data may still be available on the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              variant="destructive"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
