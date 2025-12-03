"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Bot,
  User,
  FileText,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Pencil,
  X,
  Scale,
  ArrowUp,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import {
  useChatStore,
  useCurrentConversation,
} from "@/lib/stores";
import { streamChatWithTypewriter, getSuggestedQuestions } from "@/lib/api";
import type { ChatMessage, ChatSource } from "@/lib/api/types";

const suggestedQuestions = [
  "What are the penalties for tax evasion in Uganda?",
  "How do I register a company in Uganda?",
  "What are the requirements for land ownership?",
  "Explain the process for filing a civil suit",
];

function formatRelativeTime(timestamp: string): string {
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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");

  const {
    conversations,
    currentConversationId,
    isLoading,
    error,
    setCurrentConversation,
    createConversation,
    deleteConversation,
    addMessage,
    updateLastMessage,
    editMessageAndTruncate,
    removeMessagesFrom,
    setLoading,
    setError,
  } = useChatStore();

  const currentConversation = useCurrentConversation();
  const [input, setInput] = useState(initialQuery || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(
        editContent.length,
        editContent.length
      );
    }
  }, [editingIndex, editContent]);

  // Create conversation and send initial query
  useEffect(() => {
    if (initialQuery && !currentConversationId) {
      const id = createConversation();
      setInput(initialQuery);
      // Delay sending to allow state to update
      setTimeout(() => handleSend(initialQuery, id), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSend = useCallback(async (message?: string, conversationId?: string, messagesForHistory?: ChatMessage[]) => {
    const text = message || input.trim();
    const convId = conversationId || currentConversationId;

    if (!text) return;

    // Create conversation if none exists
    let activeConvId = convId;
    if (!activeConvId) {
      activeConvId = createConversation();
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addMessage(activeConvId, userMessage);
    setInput("");
    setLoading(true);
    setError(null);

    // Add placeholder for assistant response
    const aiMessagePlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    addMessage(activeConvId, aiMessagePlaceholder);

    // Get conversation history for context
    const historyMessages = messagesForHistory || currentConversation?.messages || [];
    const conversationHistory = [
      ...historyMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: text },
    ];

    // Stream the response
    try {
      let fullContent = "";
      let sources: ChatSource[] = [];

      const stream = streamChatWithTypewriter({
        message: text,
        conversation_id: activeConvId,
        conversation_history: conversationHistory,
        search_mode: "hybrid",
        max_context_chunks: 10,
        temperature: 0.3,
      });

      for await (const event of stream) {
        switch (event.type) {
          case "content":
            fullContent += event.text;
            updateLastMessage(activeConvId, fullContent);
            break;
          case "content_update":
            // Backend sends sanitized content - replace the full content
            fullContent = event.fullContent;
            updateLastMessage(activeConvId, fullContent, sources, getSuggestedQuestions());
            break;
          case "citations":
            sources = event.citations;
            updateLastMessage(activeConvId, fullContent, sources, getSuggestedQuestions());
            break;
          case "error":
            setError(event.message);
            break;
          case "done":
            // Ensure final update with all data
            if (sources.length === 0) {
              updateLastMessage(activeConvId, fullContent, [], getSuggestedQuestions());
            }
            break;
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  }, [input, currentConversationId, currentConversation?.messages, createConversation, addMessage, updateLastMessage, setLoading, setError]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit(index);
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditContent("");
    }
  };

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewConversation = () => {
    createConversation();
    setInput("");
    setMobileHistoryOpen(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete);
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditContent("");
  };

  const handleEditSubmit = (index: number) => {
    if (!currentConversationId || !editContent.trim()) return;

    const trimmedContent = editContent.trim();
    const originalMessage = currentConversation?.messages[index];

    // If content hasn't changed, just cancel
    if (originalMessage?.content === trimmedContent) {
      handleCancelEdit();
      return;
    }

    // Get messages up to the edited message for history context
    const messagesBeforeEdit = currentConversation?.messages.slice(0, index) || [];

    // Edit and truncate (removes all messages after this one)
    editMessageAndTruncate(currentConversationId, index, trimmedContent);

    handleCancelEdit();

    // Re-run the query with the new content
    setTimeout(() => {
      handleSend(trimmedContent, currentConversationId, messagesBeforeEdit);
    }, 50);
  };

  const handleRegenerate = (messageIndex: number) => {
    if (!currentConversationId || !currentConversation) return;

    // Find the user message before this assistant message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;

    const userMessage = currentConversation.messages[userMessageIndex];
    if (userMessage.role !== "user") return;

    // Get messages up to (but not including) the user message for history
    const messagesBeforeUser = currentConversation.messages.slice(0, userMessageIndex);

    // Remove the assistant message
    removeMessagesFrom(currentConversationId, messageIndex);

    // Re-send the user message
    setTimeout(() => {
      handleSend(userMessage.content, currentConversationId, messagesBeforeUser);
    }, 50);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    setMobileHistoryOpen(false);
  };

  // Conversation list component (shared between sidebar and mobile sheet)
  const ConversationList = () => (
    <div className="flex-1 overflow-y-auto p-2">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No conversations yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Start a new chat to begin
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectConversation(conv.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectConversation(conv.id);
                }
              }}
              className={cn(
                "group relative cursor-pointer rounded-lg px-3 py-3 text-left transition-colors",
                currentConversationId === conv.id
                  ? "bg-accent"
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-start gap-3 pr-8">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={conv.title}>
                    {conv.title}
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
                onClick={(e) => handleDeleteClick(conv.id, e)}
                aria-label="Delete conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      {/* Account for header (4rem) and mobile bottom nav (4rem on mobile) */}
      <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)] md:flex-row lg:h-[calc(100vh-4rem)]">
        {/* Desktop Conversation Sidebar */}
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
                  onClick={handleNewConversation}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New conversation</TooltipContent>
            </Tooltip>
          </div>
          <ConversationList />
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header - Mobile */}
          <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">AI Assistant</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleNewConversation}
                aria-label="New conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Chat history">
                    <History className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetHeader className="border-b p-4">
                    <SheetTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat History
                    </SheetTitle>
                  </SheetHeader>
                  <ConversationList />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl px-4 py-6">
              {!currentConversation ||
              currentConversation.messages.length === 0 ? (
                // Empty State - Modern Design
                <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center">
                  {/* Gradient Icon Background */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    AI Legal Assistant
                  </h2>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    Ask questions about Uganda&apos;s laws, regulations, and legal
                    procedures. Get answers with citations to authoritative sources.
                  </p>

                  {/* Suggested Questions */}
                  <div className="mt-10 w-full max-w-lg">
                    <p className="mb-4 text-sm font-medium text-muted-foreground">
                      Try asking:
                    </p>
                    <div className="grid gap-3">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setInput(question);
                            inputRef.current?.focus();
                          }}
                          className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-all hover:bg-muted hover:border-primary/30 hover:shadow-sm"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-foreground/80 group-hover:text-foreground">
                            {question}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Messages List
                <div className="space-y-6">
                  {currentConversation.messages.map((message, index) => (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className={cn(
                        "flex gap-4",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "group space-y-3",
                          message.role === "user"
                            ? "max-w-[80%] text-right"
                            : "max-w-[90%]"
                        )}
                      >
                        {/* User message - editable */}
                        {message.role === "user" && editingIndex === index ? (
                          <div className="space-y-2">
                            <textarea
                              ref={editInputRef}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, index)}
                              className="w-full min-w-[300px] resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              rows={Math.min(editContent.split("\n").length + 1, 6)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEditSubmit(index)}
                                disabled={!editContent.trim()}
                              >
                                <Send className="mr-1 h-3 w-3" />
                                Send
                              </Button>
                            </div>
                          </div>
                        ) : message.role === "user" ? (
                          <div className="inline-block rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm selection:bg-primary-foreground selection:text-primary">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        ) : message.content === "" && isLoading ? (
                          // Typing indicator for empty streaming message
                          <div className="rounded-2xl bg-muted px-4 py-3">
                            <TypingIndicator />
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-muted/50 px-4 py-3">
                            <MarkdownRenderer
                              content={message.content}
                              sources={message.sources}
                              enableCitationPreviews={true}
                              isStreaming={isLoading && index === currentConversation.messages.length - 1}
                            />
                          </div>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Sources
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.sources.map((source, srcIndex) => (
                                <SourceBadge key={srcIndex} source={source} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Follow-ups */}
                        {message.suggested_followups &&
                          message.suggested_followups.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Related questions
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.suggested_followups.map(
                                  (followup, fIndex) => (
                                    <button
                                      key={fIndex}
                                      onClick={() => {
                                        setInput(followup);
                                        inputRef.current?.focus();
                                      }}
                                      className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                                    >
                                      {followup}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Message Actions */}
                        {editingIndex !== index && message.content && (
                          <div
                            className={cn(
                              "flex gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                              message.role === "user" && "justify-end"
                            )}
                          >
                            {message.role === "user" ? (
                              // User message actions
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      handleStartEdit(index, message.content)
                                    }
                                    disabled={isLoading}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit message</TooltipContent>
                              </Tooltip>
                            ) : (
                              // Assistant message actions
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        copyMessage(
                                          `${message.timestamp}-${index}`,
                                          message.content
                                        )
                                      }
                                    >
                                      {copiedId === `${message.timestamp}-${index}` ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {copiedId === `${message.timestamp}-${index}` ? "Copied!" : "Copy"}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleRegenerate(index)}
                                      disabled={isLoading}
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Regenerate response</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && editingIndex !== index && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted border">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Error indicator */}
                  {error && (
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="mx-auto flex max-w-3xl items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question..."
                rows={1}
                className="min-h-[44px] max-h-[200px] flex-1 resize-none rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="submit"
                size="icon"
                className="h-[44px] w-[44px] shrink-0"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </form>
            <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-muted-foreground">
              AI responses may contain inaccuracies. This is not legal advice. Always verify with a qualified lawyer.
            </p>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                conversation and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

interface SourceBadgeProps {
  source: ChatSource;
}

function SourceBadge({ source }: SourceBadgeProps) {
  // Get badge color based on document type
  const getBadgeClass = () => {
    switch (source.document_type) {
      case "act":
        return "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950";
      case "judgment":
        return "border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950";
      case "regulation":
        return "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950";
      case "constitution":
        return "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950";
      default:
        return "";
    }
  };

  return (
    <Link href={`/document/${source.document_id}`}>
      <Badge
        variant="outline"
        className={cn("gap-1.5 transition-colors", getBadgeClass())}
      >
        <FileText className="h-3 w-3" />
        <span className="max-w-[180px] truncate">{source.title}</span>
      </Badge>
    </Link>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="relative mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
              <Skeleton className="relative h-20 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
