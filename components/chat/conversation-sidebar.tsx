"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Scale,
  History,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
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
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  collapsed?: boolean;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelect,
  onDelete,
  collapsed = false,
}: ConversationListProps) {
  if (conversations.length === 0) {
    if (collapsed) return null;
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No conversations</p>
      </div>
    );
  }

  // Group conversations
  const groups: Record<string, Conversation[]> = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": []
  };

  conversations.forEach(conv => {
    const date = new Date(conv.updatedAt || conv.createdAt || new Date());
    const label = getDayLabel(date);
    groups[label].push(conv);
  });

  const nonEmptyGroups = Object.entries(groups).filter(([_, convs]) => convs.length > 0);

  return (
    <div className="space-y-4">
      {nonEmptyGroups.map(([label, groupConvs]) => (
        <div key={label}>
          {!collapsed && (
            <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              {label}
            </h3>
          )}
          <div className="space-y-0.5">
            {groupConvs.map((conv) => (
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
                      <MessageSquare className={cn("h-4 w-4 shrink-0", collapsed ? "h-5 w-5" : "mr-3")} />

                      {!collapsed && (
                        <>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium leading-none">
                              {stripMarkdownFromTitle(conv.title)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-6 w-6 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            onClick={(e) => onDelete(conv.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="flex items-center gap-4">
                      {stripMarkdownFromTitle(conv.title)}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Law Lens</span>
          </div>
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

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          collapsed={isCollapsed}
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
      <SheetContent side="right" className="w-[300px] p-0 sm:w-[350px]">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            History
          </SheetTitle>
          <SheetDescription className="sr-only">
            Chat history
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelect={(id) => {
              onSelectConversation(id);
              onOpenChange(false);
            }}
            onDelete={onDeleteConversation}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
