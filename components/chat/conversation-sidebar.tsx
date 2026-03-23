"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Check,
  X,
  Star,
  Search,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/stores";

// Helper to strip markdown from titles for display
export const stripMarkdownFromTitle = (title: string): string => {
  return title
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove **bold**
    .replace(/\*([^*]+)\*/g, "$1") // Remove *italic*
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "") // Remove emojis
    .replace(/^(Deep Research|Draft Contract):\s*/i, "") // Remove tool prefixes
    .trim();
};

export function formatRelativeTime(timestamp: string): string {
  if (!timestamp) return "Unknown";

  try {
    const timeStr = timestamp.endsWith("Z") || timestamp.includes("+")
      ? timestamp
      : `${timestamp}Z`;

    const date = new Date(timeStr);

    // Check for invalid date
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const exactTime = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const exactDateTime = date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Handle future dates (clock skew)
    if (diffMs < 0) return `Just now · ${exactTime}`;

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return `Just now · ${exactTime}`;
    if (diffMins < 60) return `${diffMins}m ago · ${exactTime}`;
    if (diffHours < 24) return `${diffHours}h ago · ${exactTime}`;
    if (diffDays < 7) return `${diffDays}d ago · ${exactTime}`;
    return exactDateTime;
  } catch {
    return "Unknown";
  }
}

function getDayLabel(date: Date): string {
  // Handle invalid dates
  if (!date || isNaN(date.getTime())) return "Older";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (checkDate.getTime() === today.getTime()) return "Today";
  if (checkDate.getTime() === yesterday.getTime()) return "Yesterday";
  // Use >= to include conversations from exactly 7 days ago
  if (checkDate >= lastWeek) return "Previous 7 Days";
  return "Older";
}

interface ConversationListProps {
  conversations: Conversation[];
  archivedConversations?: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, newTitle: string) => void;
  onStar: (id: string) => void;
  onUnstar: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  collapsed?: boolean;
  searchQuery?: string;
}

export function ConversationList({
  conversations,
  archivedConversations = [],
  currentConversationId,
  onSelect,
  onDelete,
  onRename,
  onStar,
  onUnstar,
  onArchive,
  onUnarchive,
  collapsed = false,
  searchQuery = "",
}: ConversationListProps) {
  // Edit state for inline renaming
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  // Archived section expanded state
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const handleStartEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(stripMarkdownFromTitle(conv.title));
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim().slice(0, 100));
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };
  const hasActiveConversations = conversations.length > 0;
  const hasArchivedConversations = archivedConversations.length > 0;

  if (!hasActiveConversations && !hasArchivedConversations) {
    if (collapsed) return null;
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
        {searchQuery ? (
          <>
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              No conversations match &ldquo;{searchQuery}&rdquo;
            </p>
          </>
        ) : (
          <>
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations</p>
          </>
        )}
      </div>
    );
  }

  // Separate starred (pinned) conversations from the rest
  const starredConversations = conversations.filter(conv => conv.isStarred);
  const unstarredConversations = conversations.filter(conv => !conv.isStarred);

  // Group non-starred conversations by date
  const groups: Record<string, Conversation[]> = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": []
  };

  unstarredConversations.forEach(conv => {
    const date = new Date(conv.updatedAt || conv.createdAt || new Date());
    const label = getDayLabel(date);
    groups[label].push(conv);
  });

  const nonEmptyGroups = Object.entries(groups).filter(([, convs]) => convs.length > 0);

  // Handler for toggling star
  const handleToggleStar = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conv.isStarred) {
      onUnstar(conv.id);
    } else {
      onStar(conv.id);
    }
  };

  // Handler for archiving
  const handleArchive = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(conv.id);
  };

  // Handler for unarchiving
  const handleUnarchive = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    onUnarchive(conv.id);
  };

  // Render a single conversation item
  const renderConversationItem = (conv: Conversation, isPinned: boolean = false) => (
    <TooltipProvider key={conv.id} delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(conv.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(conv.id);
              }
            }}
            className={cn(
              "group relative flex cursor-pointer items-center rounded-lg py-2",
              collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "px-2",
              currentConversationId === conv.id
                ? surfaceClasses.rowInteractiveActive
                : cn(surfaceClasses.rowInteractive, "text-muted-foreground")
            )}
          >
            {/* Icon: Star for pinned, MessageSquare for regular */}
            {isPinned && !collapsed ? (
              <Star className="h-4 w-4 shrink-0 mr-3 fill-primary text-primary" />
            ) : (
              <MessageSquare className={cn("ll-icon-muted h-4 w-4 shrink-0", collapsed ? "h-5 w-5" : "mr-3")} />
            )}

            {!collapsed && (
              <>
                {editingId === conv.id ? (
                  // Inline edit mode
                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEdit}
                      autoFocus
                      maxLength={100}
                      className="flex-1 h-6 px-1.5 text-sm bg-background border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label="Rename conversation"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ll-icon-button h-6 w-6 text-secondary-foreground"
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                    >
                      <Check className="h-3 w-3" />
                      <span className="sr-only">Save</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ll-icon-button h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </div>
                ) : (
                  // Normal display mode
                  <>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium leading-none">
                        {stripMarkdownFromTitle(conv.title)}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground/60 mt-0.5">
                        {formatRelativeTime(conv.updatedAt || conv.createdAt)}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className={cn(
                        "ll-icon-button h-6 w-6",
                        conv.isStarred
                            ? "text-primary"
                            : ""
                        )}
                        onClick={(e) => handleToggleStar(conv, e)}
                      >
                        <Star className={cn("h-3 w-3", conv.isStarred && "fill-current")} />
                        <span className="sr-only">{conv.isStarred ? "Unpin" : "Pin"}</span>
                      </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="ll-icon-button h-6 w-6"
                      onClick={(e) => handleStartEdit(conv, e)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Rename</span>
                      </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="ll-icon-button h-6 w-6"
                      onClick={(e) => handleArchive(conv, e)}
                        title="Archive"
                      >
                        <Archive className="h-3 w-3" />
                        <span className="sr-only">Archive</span>
                      </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="ll-icon-button ll-icon-button-danger h-6 w-6"
                      onClick={(e) => onDelete(conv.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="flex items-center gap-4">
            {isPinned && <Star className="h-3 w-3 fill-primary text-primary" />}
            {stripMarkdownFromTitle(conv.title)}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-4">
      {/* Pinned Section */}
      {starredConversations.length > 0 && (
        <div>
          {!collapsed && (
            <h3 className="mb-2 px-2 text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              Pinned
            </h3>
          )}
          <div className="space-y-0.5">
            {starredConversations.map((conv) => renderConversationItem(conv, true))}
          </div>
        </div>
      )}

      {/* Date-grouped sections */}
      {nonEmptyGroups.map(([label, groupConvs]) => (
        <div key={label}>
          {!collapsed && (
            <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              {label}
            </h3>
          )}
          <div className="space-y-0.5">
            {groupConvs.map((conv) => renderConversationItem(conv, false))}
          </div>
        </div>
      ))}

      {/* Archived Section */}
      {archivedConversations.length > 0 && !collapsed && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={() => setArchivedExpanded(!archivedExpanded)}
            className="ll-text-link flex w-full items-center gap-1 px-2 mb-2 text-xs font-medium uppercase tracking-wider"
          >
            {archivedExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Archive className="h-3 w-3" />
            Archived ({archivedConversations.length})
          </button>
          {archivedExpanded && (
            <div className="space-y-0.5">
              {archivedConversations.map((conv) => (
                <TooltipProvider key={conv.id} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(conv.id);
                          }
                        }}
                        className={cn(
                          "group relative flex cursor-pointer items-center rounded-lg py-2 px-2",
                          currentConversationId === conv.id
                            ? surfaceClasses.rowInteractiveActive
                            : cn(surfaceClasses.rowInteractive, "text-muted-foreground")
                        )}
                      >
                        <Archive className="ll-icon-muted h-4 w-4 shrink-0 mr-3 text-muted-foreground/50" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium leading-none opacity-70">
                            {stripMarkdownFromTitle(conv.title)}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground/60 mt-0.5">
                            {formatRelativeTime(conv.updatedAt || conv.createdAt)}
                          </p>
                        </div>
                        <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="ll-icon-button h-6 w-6"
                            onClick={(e) => handleUnarchive(conv, e)}
                            title="Restore from archive"
                          >
                            <ArchiveRestore className="h-3 w-3" />
                            <span className="sr-only">Unarchive</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="ll-icon-button ll-icon-button-danger h-6 w-6"
                            onClick={(e) => onDelete(conv.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  archivedConversations: Conversation[];
  currentConversationId: string | null;
  isFetchingHistory?: boolean;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onStarConversation: (id: string) => void;
  onUnstarConversation: (id: string) => void;
  onArchiveConversation: (id: string) => void;
  onUnarchiveConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  conversations,
  archivedConversations,
  currentConversationId,
  isFetchingHistory = false,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onStarConversation,
  onUnstarConversation,
  onArchiveConversation,
  onUnarchiveConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!debouncedQuery.trim()) return conversations;
    const query = debouncedQuery.toLowerCase();
    return conversations.filter(conv =>
      stripMarkdownFromTitle(conv.title).toLowerCase().includes(query) ||
      conv.messages.some(m => m.content.toLowerCase().includes(query))
    );
  }, [conversations, debouncedQuery]);

  return (
    <div
      className={cn(
        "hidden flex-col border-r bg-muted/10 transition-all duration-300 md:flex",
        isCollapsed ? "w-[60px]" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center h-14 border-b px-3", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Chat History</span>
            {isFetchingHistory && (
              <span className="text-[11px] text-muted-foreground">Refreshing...</span>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="ll-icon-button h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="ll-icon-muted h-4 w-4" /> : <PanelLeftClose className="ll-icon-muted h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          type="button"
          variant={isCollapsed ? "ghost" : "default"}
          size={isCollapsed ? "icon" : "default"}
          className={cn("w-full justify-start", isCollapsed && "justify-center px-0")}
        >
          <Plus className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "New Chat"}
        </Button>
      </div>

      {/* Search Input */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="ll-icon-button absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="ll-icon-muted h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {isFetchingHistory && filteredConversations.length === 0 ? (
          <div className="space-y-2 px-2 py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <ConversationList
            conversations={filteredConversations}
            archivedConversations={archivedConversations}
            currentConversationId={currentConversationId}
            onSelect={onSelectConversation}
            onDelete={onDeleteConversation}
            onRename={onRenameConversation}
            onStar={onStarConversation}
            onUnstar={onUnstarConversation}
            onArchive={onArchiveConversation}
            onUnarchive={onUnarchiveConversation}
            collapsed={isCollapsed}
            searchQuery={debouncedQuery}
          />
        )}
      </div>
    </div>
  );
}

// Mobile sheet doesn't need collapse logic, just reuses the list
interface MobileHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  archivedConversations: Conversation[];
  currentConversationId: string | null;
  isFetchingHistory?: boolean;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onStarConversation: (id: string) => void;
  onUnstarConversation: (id: string) => void;
  onArchiveConversation: (id: string) => void;
  onUnarchiveConversation: (id: string) => void;
}

export function MobileHistorySheet({
  open,
  onOpenChange,
  conversations,
  archivedConversations,
  currentConversationId,
  isFetchingHistory = false,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onStarConversation,
  onUnstarConversation,
  onArchiveConversation,
  onUnarchiveConversation,
}: MobileHistorySheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!debouncedQuery.trim()) return conversations;
    const query = debouncedQuery.toLowerCase();
    return conversations.filter(conv =>
      stripMarkdownFromTitle(conv.title).toLowerCase().includes(query) ||
      conv.messages.some(m => m.content.toLowerCase().includes(query))
    );
  }, [conversations, debouncedQuery]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="ll-icon-button h-8 w-8"
          aria-label="Chat history"
        >
          <History className="ll-icon-muted h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0 sm:w-[350px] flex flex-col">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            History
            {isFetchingHistory && (
              <span className="text-[11px] font-normal text-muted-foreground">Refreshing...</span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Chat history
          </SheetDescription>
        </SheetHeader>
        {/* Search Input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="ll-icon-button absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="ll-icon-muted h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isFetchingHistory && filteredConversations.length === 0 ? (
            <div className="space-y-2 py-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              archivedConversations={archivedConversations}
              currentConversationId={currentConversationId}
              onSelect={(id) => {
                onSelectConversation(id);
                onOpenChange(false);
              }}
              onDelete={onDeleteConversation}
              onRename={onRenameConversation}
              onStar={onStarConversation}
              onUnstar={onUnstarConversation}
              onArchive={onArchiveConversation}
              onUnarchive={onUnarchiveConversation}
              searchQuery={debouncedQuery}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
