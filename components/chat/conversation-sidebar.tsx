"use client";

import { MessageSquare, Plus, Trash2, Scale, History } from "lucide-react";
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
  const date = new Date(timestamp);
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

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a new chat to begin
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <div
          key={conv.id}
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
            "group relative cursor-pointer rounded-lg px-3 py-3 text-left transition-colors",
            currentConversationId === conv.id ? "bg-accent" : "hover:bg-muted"
          )}
        >
          <div className="flex items-start gap-3 pr-8">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium"
                title={stripMarkdownFromTitle(conv.title)}
              >
                {stripMarkdownFromTitle(conv.title)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {conv.messages.length} messages
                </span>
                {conv.updatedAt && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(conv.updatedAt)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={(e) => onDelete(conv.id, e)}
            aria-label="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  return (
    <div className="hidden min-w-[280px] max-w-[280px] flex-col border-r bg-muted/30 md:flex">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Chat History</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New conversation</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
        />
      </div>
    </div>
  );
}

interface MobileHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

export function MobileHistorySheet({
  open,
  onOpenChange,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
}: MobileHistorySheetProps) {
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
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat History
          </SheetTitle>
          <SheetDescription className="sr-only">
            Browse and manage your chat conversations
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-2">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelect={onSelectConversation}
            onDelete={onDeleteConversation}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
