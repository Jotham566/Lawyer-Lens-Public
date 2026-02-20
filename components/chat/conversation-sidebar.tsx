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
  const timeStr = timestamp.endsWith("Z") || timestamp.includes("+")
    ? timestamp
    : `${timestamp}Z`;

  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (checkDate.getTime() === today.getTime()) return "Today";
  if (checkDate.getTime() === yesterday.getTime()) return "Yesterday";
  if (checkDate > lastWeek) return "Previous 7 Days";
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
  if (conversations.length === 0) {
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
            className={cn(
              "group relative flex cursor-pointer items-center rounded-lg py-2 transition-colors",
              collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "px-2",
              currentConversationId === conv.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {/* Icon: Star for pinned, MessageSquare for regular */}
            {isPinned && !collapsed ? (
              <Star className="h-4 w-4 shrink-0 mr-3 fill-amber-400 text-amber-400" />
            ) : (
              <MessageSquare className={cn("h-4 w-4 shrink-0", collapsed ? "h-5 w-5" : "mr-3")} />
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
                      className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                    >
                      <Check className="h-3 w-3" />
                      <span className="sr-only">Save</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
                        className={cn(
                          "h-6 w-6",
                          conv.isStarred
                            ? "text-amber-400 hover:text-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                            : "hover:bg-muted hover:text-amber-400"
                        )}
                        onClick={(e) => handleToggleStar(conv, e)}
                      >
                        <Star className={cn("h-3 w-3", conv.isStarred && "fill-current")} />
                        <span className="sr-only">{conv.isStarred ? "Unpin" : "Pin"}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted hover:text-green-500"
                        onClick={(e) => handleStartEdit(conv, e)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Rename</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted hover:text-blue-500"
                        onClick={(e) => handleArchive(conv, e)}
                        title="Archive"
                      >
                        <Archive className="h-3 w-3" />
                        <span className="sr-only">Archive</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
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
            {isPinned && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
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
            <h3 className="mb-2 px-2 text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
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
            onClick={() => setArchivedExpanded(!archivedExpanded)}
            className="flex items-center gap-1 w-full px-2 mb-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider hover:text-muted-foreground transition-colors"
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
                        className={cn(
                          "group relative flex cursor-pointer items-center rounded-lg py-2 px-2 transition-colors",
                          currentConversationId === conv.id
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Archive className="h-4 w-4 shrink-0 mr-3 text-muted-foreground/50" />
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
                            className="h-6 w-6 hover:bg-muted hover:text-primary"
                            onClick={(e) => handleUnarchive(conv, e)}
                            title="Restore from archive"
                          >
                            <ArchiveRestore className="h-3 w-3" />
                            <span className="sr-only">Unarchive</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
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
          <span className="font-semibold text-sm">Chat History</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
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
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
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
          className="h-8 w-8"
          aria-label="Chat history"
        >
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0 sm:w-[350px] flex flex-col">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            History
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
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
