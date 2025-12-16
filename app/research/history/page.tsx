"use client";

import { useState } from "react";
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
  PageHeader,
  EmptyState,
  AlertBanner,
} from "@/components/common";
import {
  useResearchSessionsStore,
  type ResearchSessionSummary,
} from "@/lib/stores";
import type { ResearchStatus } from "@/lib/api/research";
import { formatDistanceToNow } from "date-fns";

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
  const router = useRouter();
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

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push(`/research?session=${session.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isEditing ? (
                <div
                  className="flex items-center gap-1 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSaveTitle}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditTitle(session.title);
                      setIsEditing(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-sm truncate">{session.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
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
                  className={`h-3 w-3 mr-1 ${
                    isActive ? "animate-spin" : ""
                  }`}
                />
                {config.label}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
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
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResearchHistoryPage() {
  const router = useRouter();
  const { sessions, removeSession, renameSession, clearSessions } =
    useResearchSessionsStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [filter, setFilter] = useState<"all" | "complete" | "in_progress">("all");

  const filteredSessions = sessions.filter((s) => {
    if (filter === "complete") return s.status === "complete";
    if (filter === "in_progress")
      return ["clarifying", "brief_review", "researching", "writing"].includes(
        s.status
      );
    return true;
  });

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
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Research History"
        description="View and manage your past research sessions"
        backHref="/research"
        backLabel="New Research"
        actions={
          sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
            >
              Clear All
            </Button>
          )
        }
      />

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
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 mt-6">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({sessions.length})
            </Button>
            <Button
              variant={filter === "complete" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("complete")}
            >
              Complete (
              {sessions.filter((s) => s.status === "complete").length})
            </Button>
            <Button
              variant={filter === "in_progress" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("in_progress")}
            >
              In Progress (
              {
                sessions.filter((s) =>
                  ["clarifying", "brief_review", "researching", "writing"].includes(
                    s.status
                  )
                ).length
              }
              )
            </Button>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
