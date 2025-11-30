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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  "What employment rights do workers have?",
];

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

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
        {/* Conversation Sidebar */}
        <div className="hidden min-w-[280px] max-w-[280px] flex-col border-r bg-muted/30 md:flex">
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-medium">Conversations</h2>
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

          <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setCurrentConversation(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setCurrentConversation(conv.id);
                        }
                      }}
                      className={cn(
                        "group relative cursor-pointer rounded-lg px-2 py-2 pr-9 text-left text-sm transition-colors",
                        currentConversationId === conv.id
                          ? "bg-accent"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium" title={conv.title}>
                            {conv.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conv.messages.length} messages
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conv.id, e);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl px-4 py-6">
              {!currentConversation ||
              currentConversation.messages.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">AI Legal Assistant</h2>
                  <p className="mt-2 max-w-md text-muted-foreground">
                    Ask questions about Uganda&apos;s laws, regulations, and legal
                    procedures. I&apos;ll search through thousands of documents to
                    find relevant information.
                  </p>

                  <div className="mt-8 w-full max-w-lg">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Try asking:
                    </p>
                    <div className="grid gap-2">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setInput(question);
                            inputRef.current?.focus();
                          }}
                          className="rounded-lg border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                        >
                          &quot;{question}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Messages List
                <div className="space-y-8">
                  {currentConversation.messages.map((message, index) => (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className={cn(
                        "flex gap-4",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "group space-y-3",
                          message.role === "user"
                            ? "max-w-[75%] text-right"
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
                              className="w-full min-w-[300px] resize-none rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                          <div className="inline-block rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4 space-y-2 border-t pt-4">
                            <p className="text-sm font-medium text-muted-foreground">
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
                            <div className="mt-4 space-y-3">
                              <p className="text-sm font-medium text-muted-foreground">
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
                                      className="rounded-full border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted"
                                    >
                                      {followup}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Message Actions */}
                        {editingIndex !== index && (
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
                                    className="h-6 w-6"
                                    onClick={() =>
                                      handleStartEdit(index, message.content)
                                    }
                                    disabled={isLoading}
                                  >
                                    <Pencil className="h-3 w-3" />
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
                                      className="h-6 w-6"
                                      onClick={() =>
                                        copyMessage(
                                          `${message.timestamp}-${index}`,
                                          message.content
                                        )
                                      }
                                    >
                                      {copiedId === `${message.timestamp}-${index}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleRegenerate(index)}
                                      disabled={isLoading}
                                    >
                                      <RefreshCw className="h-3 w-3" />
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  )}

                  {/* Error indicator */}
                  {error && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
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
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a legal question..."
                  rows={1}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{
                    minHeight: "48px",
                    maxHeight: "200px",
                  }}
                />
                <Button
                  size="icon"
                  className="absolute bottom-1.5 right-1.5 h-8 w-8"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                AI responses are generated and may contain inaccuracies. This is
                not legal advice.
              </p>
            </div>
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
        className={cn("gap-1 transition-colors", getBadgeClass())}
      >
        <FileText className="h-3 w-3" />
        <span className="max-w-[150px] truncate">{source.title}</span>
        {source.human_readable_id && (
          <span className="text-muted-foreground text-xs">
            [{source.human_readable_id}]
          </span>
        )}
      </Badge>
    </Link>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
