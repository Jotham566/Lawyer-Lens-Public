"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { PageErrorBoundary } from "@/components/error-boundary";
import {
  ConversationSidebar,
  MobileHistorySheet,
  ChatInput,
  EmptyState,
  VirtualizedMessageList,
  type ToolMode,
} from "@/components/chat";
import { CitationProvider, ResponsiveSourceView } from "@/components/citations";
import { useChatStore, useCurrentConversation, useActiveConversations } from "@/lib/stores";
import {
  streamChatWithTypewriter,
  getSuggestedQuestions,
  createResearchSession,
} from "@/lib/api";
import { APIError } from "@/lib/api/client";
import { useRequireAuth, useAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import { useEntitlements } from "@/hooks/use-entitlements";
import {
  UpgradeRequiredModal,
  useUpgradeModal,
} from "@/components/entitlements/upgrade-required-modal";
import type {
  ChatMessage as ChatMessageType,
  ChatSource,
  VerificationStatus,
  ConfidenceInfo,
} from "@/lib/api/types";
import type { ToolProgress, ResearchResult } from "@/components/chat/tool-message";

function ChatContent() {
  // Require authentication to access chat
  const { isLoading: authLoading } = useRequireAuth();
  const { accessToken } = useAuth();
  const { refresh: refreshEntitlements } = useEntitlements();

  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");

  const {
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
    fetchConversations,
    fetchConversation,
    replaceConversationId,
  } = useChatStore();

  // IMPORTANT: All hooks must be called before any conditional returns
  // to maintain consistent hook order across renders
  const conversations = useActiveConversations();
  const currentConversation = useCurrentConversation();

  const [input, setInput] = useState(initialQuery || "");
  const [selectedTool, setSelectedTool] = useState<ToolMode>("chat");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tool execution state
  const [_activeToolExecution, setActiveToolExecution] = useState<{
    tool: ToolMode;
    query: string;
    status: "running" | "complete" | "error";
    progress?: ToolProgress;
    result?: ResearchResult | null;
    error?: string;
    redirectToChat?: boolean;
  } | null>(null);
  void _activeToolExecution;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fetchingConversationRef = useRef<Set<string>>(new Set());

  // Upgrade modal for feature gating
  const {
    isOpen: upgradeModalOpen,
    details: upgradeDetails,
    showUpgradeModal,
    hideUpgradeModal,
  } = useUpgradeModal();

  // Focus edit input when editing
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [editingIndex, editContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N - New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createConversation();
        setInput("");
      }

      // Escape - Cancel editing or close mobile sheet
      if (e.key === "Escape") {
        if (editingIndex !== null) {
          setEditingIndex(null);
          setEditContent("");
        } else if (mobileHistoryOpen) {
          setMobileHistoryOpen(false);
        } else if (deleteDialogOpen) {
          setDeleteDialogOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [createConversation, editingIndex, mobileHistoryOpen, deleteDialogOpen]);

  // Create conversation and send initial query
  useEffect(() => {
    if (initialQuery && !currentConversationId) {
      const id = createConversation();
      setInput(initialQuery);
      setTimeout(() => handleSend(initialQuery, id), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Fetch conversation history on mount/auth
  useEffect(() => {
    if (accessToken) {
      fetchConversations(accessToken);
    }
  }, [accessToken, fetchConversations]);

  // Auto-fetch conversation details when selecting a conversation with empty messages
  useEffect(() => {
    if (!currentConversationId || !accessToken) return;
    if (fetchingConversationRef.current.has(currentConversationId)) return;

    // Check conversation state directly to avoid dependency issues
    const conv = useChatStore.getState().conversations.find(c => c.id === currentConversationId);
    if (conv && conv.messages.length === 0) {
      fetchingConversationRef.current.add(currentConversationId);
      fetchConversation(currentConversationId, accessToken).finally(() => {
        fetchingConversationRef.current.delete(currentConversationId);
      });
    }
  }, [currentConversationId, accessToken, fetchConversation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Stream a response for given message and history (doesn't add user message)
  const streamResponse = useCallback(
    async (text: string, activeConvId: string, conversationHistory: { role: string; content: string }[]) => {
      setLoading(true);
      setError(null);

      const aiMessagePlaceholder: ChatMessageType = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      addMessage(activeConvId, aiMessagePlaceholder);

      try {
        let fullContent = "";
        let sources: ChatSource[] = [];
        let verification: VerificationStatus | undefined;
        let confidenceInfo: ConfidenceInfo | undefined;

        const stream = streamChatWithTypewriter(
          {
            message: text,
            conversation_id: activeConvId,
            conversation_history: conversationHistory,
            search_mode: "hybrid",
            max_context_chunks: 10,
            temperature: 0.3,
          },
          {}, // default typewriter config
          accessToken // pass access token for usage tracking
        );

        for await (const event of stream) {
          switch (event.type) {
            case "content":
              fullContent += event.text;
              updateLastMessage(activeConvId, fullContent);
              break;
            case "content_update":
              fullContent = event.fullContent;
              updateLastMessage(activeConvId, fullContent, sources, getSuggestedQuestions(), verification, confidenceInfo);
              break;
            case "citations":
              sources = event.citations;
              updateLastMessage(activeConvId, fullContent, sources, getSuggestedQuestions(), verification, confidenceInfo);
              break;
            case "verification":
              verification = event.data.verification;
              confidenceInfo = event.data.confidence_info;
              updateLastMessage(activeConvId, fullContent, sources, getSuggestedQuestions(), verification, confidenceInfo);
              break;
            case "error":
              setError(event.message);
              break;
            case "conversation_id":
              // Backend assigned a persistent ID - update local state if different
              if (activeConvId !== event.id) {
                // Update the store with the new ID
                replaceConversationId(activeConvId, event.id);
                // Update local ref/variable for subsequent updates in this loop
                activeConvId = event.id; // Crucial: update loop variable so subsequent message updates use new ID
              }
              break;
            case "done":
              if (sources.length === 0) {
                updateLastMessage(activeConvId, fullContent, [], getSuggestedQuestions(), verification, confidenceInfo);
              }
              break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get response");
      } finally {
        setLoading(false);
        // Refresh entitlements to update usage counts after query
        refreshEntitlements();
      }
    },
    [addMessage, updateLastMessage, setLoading, setError, refreshEntitlements, accessToken]
  );

  // Regular chat function (adds user message, then streams response)
  const handleRegularChat = useCallback(
    async (text: string, activeConvId: string, messagesForHistory?: ChatMessageType[]) => {
      const userMessage: ChatMessageType = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      addMessage(activeConvId, userMessage);

      const historyMessages = messagesForHistory || currentConversation?.messages || [];
      const conversationHistory = [
        ...historyMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: text },
      ];

      await streamResponse(text, activeConvId, conversationHistory);
    },
    [currentConversation?.messages, addMessage, streamResponse]
  );

  // Regenerate response for existing user message (doesn't add user message)
  const regenerateForMessage = useCallback(
    async (userContent: string, activeConvId: string, messagesIncludingUser: ChatMessageType[]) => {
      const conversationHistory = messagesIncludingUser.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      await streamResponse(userContent, activeConvId, conversationHistory);
    },
    [streamResponse]
  );

  const handleSend = useCallback(
    async (message?: string, conversationId?: string, messagesForHistory?: ChatMessageType[]) => {
      const text = message || input.trim();
      const convId = conversationId || currentConversationId;

      if (!text) {
        return;
      }

      // Handle Deep Research tool
      if (selectedTool === "deep-research") {
        setInput("");
        const toolToUse = selectedTool;
        setSelectedTool("chat");

        let activeConvId = convId;
        if (!activeConvId) {
          activeConvId = createConversation();
        }

        const userMessage: ChatMessageType = {
          role: "user",
          content: `🔍 **Deep Research:** ${text}`,
          timestamp: new Date().toISOString(),
        };
        addMessage(activeConvId, userMessage);

        setActiveToolExecution({
          tool: toolToUse,
          query: text,
          status: "running",
          progress: { phase: "starting", message: "Starting deep research..." },
        });

        try {
          // Pass force_research: true since user explicitly selected Deep Research
          // This tells the backend to use deep research even for simple queries
          const session = await createResearchSession(
            { query: text, force_research: true },
            accessToken
          );

          // Check if triage determined this should redirect to contract drafting
          // Note: We no longer check redirect_to_chat since force_research overrides that
          if (session.current_step === "redirect_to_contract") {
            setActiveToolExecution(null);
            const assistantMessage: ChatMessageType = {
              role: "assistant",
              content: `This query appears to be about contract drafting. Visit the [Contract Drafting page](/contracts?q=${encodeURIComponent(text)}) for a guided contract creation experience.`,
              timestamp: new Date().toISOString(),
            };
            addMessage(activeConvId, assistantMessage);
            return;
          }

          setActiveToolExecution((prev) =>
            prev
              ? {
                ...prev,
                progress: {
                  phase: session.status === "clarifying" ? "clarifying" : "researching",
                  message:
                    session.status === "clarifying"
                      ? "This query requires clarification. Please use the full research interface."
                      : "Research in progress...",
                },
              }
              : null
          );

          const assistantMessage: ChatMessageType = {
            role: "assistant",
            content: `I've started a deep research session for your query. The research requires a multi-step process.\n\n**Query:** ${text}\n\n**Status:** ${session.status}\n\nFor the full research experience with clarifying questions and detailed reports, visit the [Research page](/research?session=${session.session_id}).`,
            timestamp: new Date().toISOString(),
          };
          addMessage(activeConvId, assistantMessage);
          setActiveToolExecution(null);
        } catch (err) {
          setActiveToolExecution(null);

          // Check for feature gating error (tier restriction)
          if (err instanceof APIError && err.isFeatureGatingError()) {
            const gatingDetails = err.getFeatureGatingDetails();
            if (gatingDetails) {
              showUpgradeModal(gatingDetails);
              // Remove the user message since the feature isn't available
              removeMessagesFrom(activeConvId, messagesForHistory?.length ?? 0);
              return;
            }
          }

          // Log unexpected errors
          console.error("Research error:", err);

          setActiveToolExecution({
            tool: toolToUse,
            query: text,
            status: "error",
            error: err instanceof Error ? err.message : "Failed to start research",
          });

          const errorMessage: ChatMessageType = {
            role: "assistant",
            content: `Sorry, I couldn't start the deep research. ${err instanceof Error ? err.message : "Please try again."}`,
            timestamp: new Date().toISOString(),
          };
          addMessage(activeConvId, errorMessage);
        }
        return;
      }

      // Handle Draft Contract tool
      if (selectedTool === "draft-contract") {
        setInput("");
        setSelectedTool("chat");

        let activeConvId = convId;
        if (!activeConvId) {
          activeConvId = createConversation();
        }

        const userMessage: ChatMessageType = {
          role: "user",
          content: `📄 **Draft Contract:** ${text}`,
          timestamp: new Date().toISOString(),
        };
        addMessage(activeConvId, userMessage);

        const assistantMessage: ChatMessageType = {
          role: "assistant",
          content: `I can help you draft a contract. Contract drafting requires gathering specific details about the parties and terms.\n\n**Your request:** ${text}\n\nTo create your contract with a guided process, visit the [Contract Drafting page](/contracts?q=${encodeURIComponent(text)}).`,
          timestamp: new Date().toISOString(),
        };
        addMessage(activeConvId, assistantMessage);
        return;
      }

      // Regular chat
      let activeConvId = convId;
      if (!activeConvId) {
        activeConvId = createConversation();
      }

      setInput("");
      await handleRegularChat(text, activeConvId, messagesForHistory);
    },
    [input, currentConversationId, createConversation, selectedTool, handleRegularChat, addMessage, showUpgradeModal, removeMessagesFrom, accessToken]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const handleEditSubmit = useCallback((index: number, content: string) => {
    if (isLoading) return;
    if (!currentConversationId || !content.trim()) return;

    const trimmedContent = content.trim();
    const originalMessage = currentConversation?.messages[index];

    if (originalMessage?.content === trimmedContent) {
      handleCancelEdit();
      return;
    }

    // Capture messages before edit for history
    const messagesBeforeEdit = currentConversation?.messages.slice(0, index) || [];
    const convId = currentConversationId;

    // Edit the message (this keeps the edited user message and truncates everything after)
    editMessageAndTruncate(convId, index, trimmedContent);
    handleCancelEdit();

    // Use regenerateForMessage which doesn't add a new user message
    // The history should include all messages up to and including the edited user message
    const messagesIncludingEditedUser: ChatMessageType[] = [
      ...messagesBeforeEdit,
      { role: "user", content: trimmedContent, timestamp: new Date().toISOString() },
    ];

    setTimeout(() => {
      regenerateForMessage(trimmedContent, convId, messagesIncludingEditedUser);
    }, 100);
  }, [isLoading, currentConversationId, currentConversation, editMessageAndTruncate, regenerateForMessage]);

  const handleRegenerate = useCallback((messageIndex: number) => {
    // Don't allow regeneration while already loading
    if (isLoading) return;
    if (!currentConversationId || !currentConversation) return;

    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;

    const userMessage = currentConversation.messages[userMessageIndex];
    if (userMessage.role !== "user") return;

    // Capture the content and history BEFORE modifying state
    // Include all messages up to and including the user message
    const userContent = userMessage.content;
    const messagesIncludingUser = currentConversation.messages.slice(0, userMessageIndex + 1);
    const convId = currentConversationId;

    // Only remove the assistant message (from messageIndex onwards)
    // Keep the user message intact
    removeMessagesFrom(convId, messageIndex);

    // Use regenerateForMessage which doesn't add a new user message
    setTimeout(() => {
      regenerateForMessage(userContent, convId, messagesIncludingUser);
    }, 100);
  }, [isLoading, currentConversationId, currentConversation, removeMessagesFrom, regenerateForMessage]);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversation(id);
    setMobileHistoryOpen(false);
  }, [setCurrentConversation]);

  const handleSelectQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  // Show loading while checking auth (placed after all hooks)
  if (authLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <CitationProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)] md:flex-row lg:h-[calc(100vh-4rem)]">
          {/* Desktop Sidebar */}
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteClick}
            onNewConversation={handleNewConversation}
          />

          {/* Chat Area */}
          <div className="flex flex-1 flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="font-semibold">Legal Assistant</h1>
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
                <MobileHistorySheet
                  open={mobileHistoryOpen}
                  onOpenChange={setMobileHistoryOpen}
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onSelectConversation={handleSelectConversation}
                  onDeleteConversation={handleDeleteClick}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden" role="region" aria-label="Chat messages">
              {!currentConversation || currentConversation.messages.length === 0 ? (
                <div className="mx-auto max-w-3xl px-4 py-6">
                  <EmptyState
                    selectedTool={selectedTool}
                    onClearTool={() => setSelectedTool("chat")}
                    onSelectQuestion={handleSelectQuestion}
                  />
                </div>
              ) : (
                <VirtualizedMessageList
                  messages={currentConversation.messages}
                  isLoading={isLoading}
                  error={error}
                  editingIndex={editingIndex}
                  copiedId={copiedId}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditSubmit={handleEditSubmit}
                  onCopy={copyMessage}
                  onRegenerate={handleRegenerate}
                  onSelectFollowup={handleSelectQuestion}
                  editInputRef={editInputRef}
                />
              )}
            </div>

            {/* Input Area */}
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSubmit={() => handleSend()}
              isLoading={isLoading}
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
            />
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this conversation and all
                  its messages.
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

          {/* Upgrade Required Modal for Feature Gating */}
          <UpgradeRequiredModal
            open={upgradeModalOpen}
            onClose={hideUpgradeModal}
            details={upgradeDetails}
          />

          {/* Citation Side Panel / Bottom Sheet */}
          <ResponsiveSourceView />
        </div>
      </TooltipProvider>
    </CitationProvider>
  );
}

export default function ChatPage() {
  return (
    <PageErrorBoundary fallback="chat">
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
    </PageErrorBoundary>
  );
}
