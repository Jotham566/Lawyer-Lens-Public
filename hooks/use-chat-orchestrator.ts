"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useChatStore, useCurrentConversation, useActiveConversations, useArchivedConversations } from "@/lib/stores";
import { useAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useUpgradeModal } from "@/components/entitlements/upgrade-required-modal";
import { useCitationOptional } from "@/components/citations";
import {
    streamChatWithTypewriter,
    getSuggestedQuestions,
    createResearchSession,
} from "@/lib/api";
import { APIError } from "@/lib/api/client";
import type {
    ChatMessage as ChatMessageType,
    ChatSource,
    VerificationStatus,
    ConfidenceInfo,
} from "@/lib/api/types";
import type { ToolMode } from "@/components/chat";
import type { ToolProgress, ResearchResult } from "@/components/chat/tool-message";

export function useChatOrchestrator() {
    const { isAuthenticated } = useAuth();
    const { refresh: refreshEntitlements } = useEntitlements();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q");

    // Global Chat Store
    const {
        currentConversationId,
        isLoading,
        error,
        setCurrentConversation,
        createConversation,
        deleteConversationAsync,
        renameConversation,
        starConversation,
        unstarConversation,
        archiveConversation,
        unarchiveConversation,
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

    const conversations = useActiveConversations();
    const archivedConversations = useArchivedConversations();
    const currentConversation = useCurrentConversation();
    const citationContext = useCitationOptional();

    // Local UI State
    const [input, setInput] = useState(initialQuery || "");
    const [selectedTool, setSelectedTool] = useState<ToolMode>("chat");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Tool Execution State
    const [, setActiveToolExecution] = useState<{
        tool: ToolMode;
        query: string;
        status: "running" | "complete" | "error";
        progress?: ToolProgress;
        result?: ResearchResult | null;
        error?: string;
        redirectToChat?: boolean;
    } | null>(null);

    // Edit/Delete UI State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
    const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);
    const fetchingConversationRef = useRef<Set<string>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);

    // Integration Hooks
    const {
        isOpen: upgradeModalOpen,
        details: upgradeDetails,
        showUpgradeModal,
        hideUpgradeModal,
    } = useUpgradeModal();

    // --- Effects ---

    // Focus edit input
    useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.setSelectionRange(editContent.length, editContent.length);
        }
    }, [editingIndex, editContent]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input/textarea
            const isTyping = document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA" ||
                (document.activeElement as HTMLElement)?.isContentEditable;

            // Cmd+N or Ctrl+N - New conversation
            if ((e.metaKey || e.ctrlKey) && e.key === "n") {
                e.preventDefault();
                createConversation();
                setInput("");
            }

            // "?" key - Show keyboard shortcuts (only when not typing)
            if (e.key === "?" && !isTyping && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setShortcutsDialogOpen(true);
            }

            // Escape key handlers
            if (e.key === "Escape") {
                if (shortcutsDialogOpen) {
                    setShortcutsDialogOpen(false);
                } else if (editingIndex !== null) {
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
    }, [createConversation, editingIndex, mobileHistoryOpen, deleteDialogOpen, shortcutsDialogOpen]);

    // Fetch Conversations on Auth
    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        }
    }, [isAuthenticated, fetchConversations]);

    // Citation Reset Logic
    const resetCitationsRef = useRef(citationContext?.resetCitations);
    useEffect(() => {
        resetCitationsRef.current = citationContext?.resetCitations;
    }, [citationContext?.resetCitations]);

    useEffect(() => {
        resetCitationsRef.current?.();
    }, [currentConversationId]);

    // Auto-fetch deep conversation details
    useEffect(() => {
        if (!currentConversationId || !isAuthenticated) return;
        if (fetchingConversationRef.current.has(currentConversationId)) return;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(currentConversationId)) return;

        const conv = useChatStore.getState().conversations.find(c => c.id === currentConversationId);
        if (conv && conv.messages.length === 0) {
            fetchingConversationRef.current.add(currentConversationId);
            fetchConversation(currentConversationId).finally(() => {
                fetchingConversationRef.current.delete(currentConversationId);
            });
        }
    }, [currentConversationId, isAuthenticated, fetchConversation]);

    // --- Logic Helpers ---

    // 1. Core Streaming Logic
    const streamResponse = useCallback(
        async (text: string, activeConvId: string, conversationHistory: { role: string; content: string }[]) => {
            setLoading(true);
            setError(null);

            // Create AbortController for this stream
            const controller = new AbortController();
            abortControllerRef.current = controller;

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
                let followups: string[] = [];

                const stream = streamChatWithTypewriter(
                    {
                        message: text,
                        conversation_id: activeConvId,
                        conversation_history: conversationHistory,
                        search_mode: "hybrid",
                        max_context_chunks: 10,
                        temperature: 0.3,
                    },
                    {},
                    controller.signal
                );

                for await (const event of stream) {
                    switch (event.type) {
                        case "content":
                            fullContent += event.text;
                            updateLastMessage(activeConvId, fullContent);
                            break;
                        case "content_update":
                        case "citations":
                        case "verification":
                        case "followups":
                            if (event.type === 'content_update') fullContent = event.fullContent;
                            if (event.type === 'citations') sources = event.citations;
                            if (event.type === 'verification') {
                                verification = event.data.verification;
                                confidenceInfo = event.data.confidence_info;
                            }
                            if (event.type === 'followups') followups = event.questions;

                            updateLastMessage(activeConvId, fullContent, sources, followups.length > 0 ? followups : getSuggestedQuestions(), verification, confidenceInfo);
                            break;
                        case "error":
                            setError(event.message);
                            break;
                        case "conversation_id":
                            if (activeConvId !== event.id) {
                                replaceConversationId(activeConvId, event.id);
                                activeConvId = event.id;
                            }
                            break;
                        case "done":
                            if (sources.length === 0) {
                                updateLastMessage(activeConvId, fullContent, [], followups.length > 0 ? followups : getSuggestedQuestions(), verification, confidenceInfo);
                            }
                            break;
                    }
                }
            } catch (err) {
                // Don't show error for intentional abort
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // Aborted by user — keep partial content, no error
                } else {
                    setError(err instanceof Error ? err.message : "Failed to get response");
                }
            } finally {
                abortControllerRef.current = null;
                setLoading(false);
                refreshEntitlements();
            }
        },
        [addMessage, updateLastMessage, setLoading, setError, refreshEntitlements, replaceConversationId]
    );

    // 2. Regular Chat Handler
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

    // 3. Main Send Handler
    const handleSend = useCallback(
        async (message?: string, conversationId?: string, messagesForHistory?: ChatMessageType[]) => {
            const text = message || input.trim();
            const convId = conversationId || currentConversationId;

            if (!text) return;

            // Deep Research Tool
            if (selectedTool === "deep-research") {
                setInput("");
                const toolToUse = selectedTool;
                setSelectedTool("chat");

                const activeConvId = convId || createConversation();

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
                    const session = await createResearchSession({ query: text, force_research: true });

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

                    setActiveToolExecution((prev) => prev ? {
                        ...prev,
                        progress: {
                            phase: session.status === "clarifying" ? "clarifying" : "researching",
                            message: session.status === "clarifying" ? "This query requires clarification..." : "Research in progress...",
                        }
                    } : null);

                    const assistantMessage: ChatMessageType = {
                        role: "assistant",
                        content: `I've started a deep research session for your query. The research requires a multi-step process.\n\n**Query:** ${text}\n\n**Status:** ${session.status}\n\nFor the full research experience with clarifying questions and detailed reports, visit the [Research page](/research?session=${session.session_id}).`,
                        timestamp: new Date().toISOString(),
                    };
                    addMessage(activeConvId, assistantMessage);
                    setActiveToolExecution(null);

                } catch (err) {
                    setActiveToolExecution(null);
                    if (err instanceof APIError && err.isFeatureGatingError()) {
                        const gatingDetails = err.getFeatureGatingDetails();
                        if (gatingDetails) {
                            showUpgradeModal(gatingDetails);
                            removeMessagesFrom(activeConvId, messagesForHistory?.length ?? 0);
                            return;
                        }
                    }
                    console.error("Research error:", err);
                    const errorMessage: ChatMessageType = {
                        role: "assistant",
                        content: `Sorry, I couldn't start the deep research. ${err instanceof Error ? err.message : "Please try again."}`,
                        timestamp: new Date().toISOString(),
                    };
                    addMessage(activeConvId, errorMessage);
                }
                return;
            }

            // Draft Contract Tool
            if (selectedTool === "draft-contract") {
                setInput("");
                setSelectedTool("chat");
                const activeConvId = convId || createConversation();

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

            // Regular Chat
            const activeConvId = convId || createConversation();
            setInput("");
            await handleRegularChat(text, activeConvId, messagesForHistory);

        },
        [input, currentConversationId, createConversation, selectedTool, handleRegularChat, addMessage, showUpgradeModal, removeMessagesFrom]
    );

    // Initial Query Handler
    useEffect(() => {
        if (initialQuery && !currentConversationId) {
            const id = createConversation();
            setInput(initialQuery);
            // Small timeout to ensure state updates propagate
            setTimeout(() => handleSend(initialQuery, id), 100);
        }
    }, [initialQuery, currentConversationId, createConversation, handleSend]);


    // 4. Regenerate / Edit Wrappers
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

    const handleEditSubmit = useCallback((index: number, content: string) => {
        if (isLoading) return;
        if (!currentConversationId || !content.trim()) return;

        const trimmedContent = content.trim();
        const originalMessage = currentConversation?.messages[index];

        if (originalMessage?.content === trimmedContent) {
            setEditingIndex(null); // Cancel
            setEditContent("");
            return;
        }

        const messagesBeforeEdit = currentConversation?.messages.slice(0, index) || [];
        const convId = currentConversationId;

        editMessageAndTruncate(convId, index, trimmedContent);
        setEditingIndex(null);
        setEditContent("");

        const messagesIncludingEditedUser: ChatMessageType[] = [
            ...messagesBeforeEdit,
            { role: "user", content: trimmedContent, timestamp: new Date().toISOString() },
        ];

        setTimeout(() => {
            regenerateForMessage(trimmedContent, convId, messagesIncludingEditedUser);
        }, 100);
    }, [isLoading, currentConversationId, currentConversation, editMessageAndTruncate, regenerateForMessage]);

    const handleRegenerate = useCallback((messageIndex: number) => {
        if (isLoading) return;
        if (!currentConversationId || !currentConversation) return;

        const userMessageIndex = messageIndex - 1;
        if (userMessageIndex < 0) return;

        const userMessage = currentConversation.messages[userMessageIndex];
        if (userMessage.role !== "user") return;

        const userContent = userMessage.content;
        const messagesIncludingUser = currentConversation.messages.slice(0, userMessageIndex + 1);
        const convId = currentConversationId;

        removeMessagesFrom(convId, messageIndex);

        setTimeout(() => {
            regenerateForMessage(userContent, convId, messagesIncludingUser);
        }, 100);
    }, [isLoading, currentConversationId, currentConversation, removeMessagesFrom, regenerateForMessage]);

    // --- UI Handlers ---

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

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

    const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setConversationToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (conversationToDelete) {
            await deleteConversationAsync(conversationToDelete);
        }
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
    };

    const handleSelectConversation = useCallback((id: string) => {
        setCurrentConversation(id);
        setMobileHistoryOpen(false);
    }, [setCurrentConversation]);

    const handleRenameConversation = useCallback((id: string, newTitle: string) => {
        renameConversation(id, newTitle);
    }, [renameConversation]);

    const handleStarConversation = useCallback((id: string) => {
        starConversation(id);
    }, [starConversation]);

    const handleUnstarConversation = useCallback((id: string) => {
        unstarConversation(id);
    }, [unstarConversation]);

    const handleArchiveConversation = useCallback((id: string) => {
        archiveConversation(id);
    }, [archiveConversation]);

    const handleUnarchiveConversation = useCallback((id: string) => {
        unarchiveConversation(id);
    }, [unarchiveConversation]);

    const handleSelectQuestion = (question: string) => {
        setInput(question);
        inputRef.current?.focus();
    };

    const setInputRef = useCallback((node: HTMLTextAreaElement | null) => {
        inputRef.current = node;
    }, []);

    const setEditInputRef = useCallback((node: HTMLTextAreaElement | null) => {
        editInputRef.current = node;
    }, []);

    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setLoading(false);
    }, [setLoading]);

    return {
        state: {
            input,
            isLoading,
            error,
            selectedTool,
            conversations,
            archivedConversations,
            currentConversation,
            currentConversationId,
            editingIndex,
            editContent,
            copiedId,
            deleteDialogOpen,
            mobileHistoryOpen,
            shortcutsDialogOpen,
            exportDialogOpen,
            upgradeModalOpen,
            upgradeDetails,
        },
        actions: {
            setInput,
            setSelectedTool,
            setInputRef,
            setEditInputRef,
            handleInputChange,
            handleKeyDown,
            handleSend,
            handleEditSubmit,
            handleStartEdit: (index: number, content: string) => { setEditingIndex(index); setEditContent(content); },
            handleCancelEdit: () => { setEditingIndex(null); setEditContent(""); },
            handleRegenerate,
            copyMessage,
            handleNewConversation,
            handleDeleteClick,
            handleConfirmDelete,
            handleSelectConversation,
            handleRenameConversation,
            handleStarConversation,
            handleUnstarConversation,
            handleArchiveConversation,
            handleUnarchiveConversation,
            handleSelectQuestion,
            setMobileHistoryOpen,
            setShortcutsDialogOpen,
            setExportDialogOpen,
            setDeleteDialogOpen,
            hideUpgradeModal,
            handleStop,
        }
    };
}
