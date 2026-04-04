"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useChatStore, useCurrentConversation, useActiveConversations, useArchivedConversations } from "@/lib/stores";
import { useAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useUpgradeModal } from "@/components/entitlements/upgrade-required-modal";
import { useCitationOptional } from "@/components/citations";
import {
    streamChatWithTypewriter,
    getSuggestedQuestions,
    createContractSession,
    createResearchSession,
    persistConversationMessage,
    submitChatFeedback,
} from "@/lib/api";
import { APIError } from "@/lib/api/client";
import type {
    ChatMessage as ChatMessageType,
    ChatFeedbackType,
    ChatSource,
    VerificationStatus,
    ConfidenceInfo,
} from "@/lib/api/types";
import type { Conversation } from "@/lib/stores";
import type { ToolMode } from "@/components/chat";
import type { ToolProgress, ResearchResult } from "@/components/chat/tool-message";

function inferContractType(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("employ") || lower.includes("job") || lower.includes("work")) {
        return "employment";
    }
    if (lower.includes("nda") || lower.includes("non-disclosure") || lower.includes("confidential")) {
        return "nda";
    }
    if (lower.includes("service") || lower.includes("consult")) {
        return "service";
    }
    if (lower.includes("sale") || lower.includes("purchase") || lower.includes("buy")) {
        return "sale";
    }
    if (lower.includes("lease") || lower.includes("rent") || lower.includes("tenancy")) {
        return "lease";
    }
    return "general";
}

export function useChatOrchestrator() {
    const { isAuthenticated } = useAuth();
    const { refresh: refreshEntitlements } = useEntitlements();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q");
    const initialConversationId = searchParams.get("conversation");
    const initialDocumentId = searchParams.get("doc");

    // Global Chat Store
    const {
        currentConversationId,
        isLoading,
        isFetchingHistory,
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
    const allConversations = useChatStore((state) => state.conversations);
    const citationContext = useCitationOptional();

    // Local UI State
    const [input, setInput] = useState(initialQuery || "");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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
    const submissionInFlightRef = useRef(false);
    const hydratedInitialConversationRef = useRef<string | null>(null);
    const didFetchHistoryRef = useRef(false);
    const migratingConversationIdsRef = useRef<Set<string>>(new Set());
    const conversationIdPatternRef = useRef(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

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
            if (didFetchHistoryRef.current) return;
            didFetchHistoryRef.current = true;
            void fetchConversations();
            return;
        }
        didFetchHistoryRef.current = false;
    }, [isAuthenticated, fetchConversations]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const refreshFromServer = () => {
            if (document.visibilityState === "hidden") {
                return;
            }

            void fetchConversations();

            const { currentConversationId: activeConversationId, isLoading: storeIsLoading } =
                useChatStore.getState();

            if (storeIsLoading || !activeConversationId) {
                return;
            }

            if (!conversationIdPatternRef.current.test(activeConversationId)) {
                return;
            }

            const activeConversation = useChatStore
                .getState()
                .conversations.find((conversation) => conversation.id === activeConversationId);

            if (!activeConversation || activeConversation.isLocalOnly) {
                return;
            }

            void fetchConversation(activeConversationId);
        };

        window.addEventListener("focus", refreshFromServer);
        document.addEventListener("visibilitychange", refreshFromServer);

        return () => {
            window.removeEventListener("focus", refreshFromServer);
            document.removeEventListener("visibilitychange", refreshFromServer);
        };
    }, [isAuthenticated, fetchConversations, fetchConversation]);

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
        if (!currentConversationId || !isAuthenticated || isLoading || isGenerating) return;
        if (fetchingConversationRef.current.has(currentConversationId)) return;

        if (!conversationIdPatternRef.current.test(currentConversationId)) return;

        const conv = useChatStore.getState().conversations.find(c => c.id === currentConversationId);
        if (conv && !conv.isLocalOnly && (conv.messages.length === 0 || conv.needsHydration)) {
            fetchingConversationRef.current.add(currentConversationId);
            fetchConversation(currentConversationId).finally(() => {
                fetchingConversationRef.current.delete(currentConversationId);
            });
        }
    }, [currentConversationId, isAuthenticated, isLoading, isGenerating, fetchConversation]);

    // --- Logic Helpers ---

    const persistToolMessage = useCallback(
        async (
            conversationId: string,
            payload: {
                role: "user" | "assistant";
                content: string;
                title?: string;
                metadata?: Record<string, unknown>;
            }
        ): Promise<string> => {
            if (!isAuthenticated) {
                return conversationId;
            }

            try {
                const persisted = await persistConversationMessage({
                    conversation_id: conversationIdPatternRef.current.test(conversationId)
                        ? conversationId
                        : undefined,
                    role: payload.role,
                    content: payload.content,
                    title: payload.title,
                    metadata: payload.metadata,
                });

                if (conversationId !== persisted.conversation_id) {
                    replaceConversationId(conversationId, persisted.conversation_id);
                    return persisted.conversation_id;
                }

                return conversationId;
            } catch (error) {
                console.error("Failed to persist tool chat message:", error);
                return conversationId;
            }
        },
        [isAuthenticated, replaceConversationId]
    );

    const syncPersistedConversation = useCallback(
        async (conversationId: string) => {
            if (!isAuthenticated || !conversationIdPatternRef.current.test(conversationId)) {
                return;
            }

            await fetchConversation(conversationId).catch(() => undefined);
            await fetchConversations().catch(() => undefined);
        },
        [isAuthenticated, fetchConversation, fetchConversations]
    );

    const migrateLocalConversation = useCallback(
        async (conversation: Conversation) => {
            if (!isAuthenticated || !conversation.isLocalOnly || conversation.messages.length === 0) {
                return;
            }

            if (migratingConversationIdsRef.current.has(conversation.id)) {
                return;
            }

            migratingConversationIdsRef.current.add(conversation.id);

            try {
                let activeConversationId = conversation.id;
                const inferredTitle =
                    conversation.title && conversation.title !== "New Conversation"
                        ? conversation.title
                        : conversation.messages.find((message) => message.role === "user")?.content;

                for (let index = 0; index < conversation.messages.length; index += 1) {
                    const message = conversation.messages[index];
                    activeConversationId = await persistToolMessage(activeConversationId, {
                        role: message.role,
                        content: message.content,
                        title: index === 0 ? inferredTitle : undefined,
                        metadata: {
                            source: "chat_page",
                            migrated_local_conversation: true,
                            original_local_conversation_id: conversation.id,
                            original_message_id: message.id,
                            original_timestamp: message.timestamp,
                            message_kind: "migrated_history",
                        },
                    });
                }

                await syncPersistedConversation(activeConversationId);
            } finally {
                migratingConversationIdsRef.current.delete(conversation.id);
            }
        },
        [isAuthenticated, persistToolMessage, syncPersistedConversation]
    );

    useEffect(() => {
        if (!isAuthenticated || isLoading) {
            return;
        }

        const pendingMigrations = allConversations.filter(
            (conversation) => conversation.isLocalOnly && conversation.messages.length > 0
        );

        for (const conversation of pendingMigrations) {
            void migrateLocalConversation(conversation);
        }
    }, [allConversations, isAuthenticated, isLoading, migrateLocalConversation]);

    // 1. Core Streaming Logic
    const streamResponse = useCallback(
        async (text: string, activeConvId: string, conversationHistory: { role: string; content: string }[], truncateFrom?: number) => {
            setLoading(true);
            setError(null);
            setIsGenerating(true);

            // Enforce a single active stream in the client.
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

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
                let assistantMessageId: string | undefined;

                const stream = streamChatWithTypewriter(
                    {
                        message: text,
                        conversation_id: activeConvId,
                        conversation_history: conversationHistory,
                        document_scope:
                            useChatStore
                                .getState()
                                .conversations.find((conversation) => conversation.id === activeConvId)
                                ?.scope || undefined,
                        search_mode: "hybrid",
                        max_context_chunks: 10,
                        temperature: 0.3,
                        truncate_from: truncateFrom,
                    },
                    {},
                    controller.signal
                );

                for await (const event of stream) {
                    switch (event.type) {
                        case "content":
                            fullContent += event.text;
                            updateLastMessage(activeConvId, fullContent, undefined, undefined, undefined, undefined, assistantMessageId);
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

                            updateLastMessage(
                                activeConvId,
                                fullContent,
                                sources,
                                followups.length > 0 ? followups : getSuggestedQuestions(),
                                verification,
                                confidenceInfo,
                                assistantMessageId
                            );
                            break;
                        case "message_id":
                            assistantMessageId = event.id;
                            updateLastMessage(activeConvId, fullContent, sources, followups.length > 0 ? followups : undefined, verification, confidenceInfo, assistantMessageId);
                            break;
                        case "error":
                            setError(event.message);
                            break;
                        case "generation_done":
                            setIsGenerating(false);
                            break;
                        case "conversation_id":
                            if (activeConvId !== event.id) {
                                replaceConversationId(activeConvId, event.id);
                                activeConvId = event.id;
                            }
                            break;
                        case "done":
                            if (sources.length === 0) {
                                updateLastMessage(
                                    activeConvId,
                                    fullContent,
                                    [],
                                    followups.length > 0 ? followups : getSuggestedQuestions(),
                                    verification,
                                    confidenceInfo,
                                    assistantMessageId
                                );
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
                // Only refetch conversation list (sidebar) — NOT the active conversation.
                // The active conversation's messages are already up-to-date from the stream.
                // Refetching the active conversation causes a race condition: the server
                // response replaces local state, briefly duplicating the user message on
                // edit/regenerate before React reconciles.
                if (!controller.signal.aborted && conversationIdPatternRef.current.test(activeConvId)) {
                    void fetchConversations(); // Refresh sidebar (title, order)
                }
                abortControllerRef.current = null;
                setIsGenerating(false);
                setLoading(false);
                refreshEntitlements();
            }
        },
        [
            addMessage,
            updateLastMessage,
            setLoading,
            setError,
            refreshEntitlements,
            replaceConversationId,
            fetchConversation,
            fetchConversations,
        ]
    );

    const handleMessageFeedback = useCallback(
        async (payload: {
            messageId: string;
            type: ChatFeedbackType;
            reason?: string;
            timestamp: string;
        }) => {
            await submitChatFeedback({
                message_id: payload.messageId,
                feedback_type: payload.type,
                reason: payload.reason,
                metadata: { submitted_at: payload.timestamp, surface: "chat_page" },
            });
        },
        []
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
        async (
            message?: string,
            conversationId?: string,
            messagesForHistory?: ChatMessageType[],
            toolOverride?: ToolMode
        ) => {
            const text = message || input.trim();
            const convId = conversationId || currentConversationId;
            const activeTool = toolOverride || "chat";

            if (!text || isLoading || submissionInFlightRef.current) return;

            submissionInFlightRef.current = true;

            try {
                // Deep Research Tool
                if (activeTool === "deep-research") {
                    setInput("");
                    setLoading(true);
                    const toolToUse = activeTool;

                    let activeConvId = convId || createConversation();

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
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "user",
                            content: userMessage.content,
                            title: text,
                            metadata: {
                                source: "chat_page",
                                tool: "deep_research",
                                message_kind: "tool_user_prompt",
                            },
                        });

                        if (session.current_step === "redirect_to_contract") {
                            setActiveToolExecution(null);
                            try {
                                const contractSession = await createContractSession({
                                    contract_type: inferContractType(text),
                                    description: text,
                                });
                                const assistantMessage: ChatMessageType = {
                                    role: "assistant",
                                    content: `This query appears to be about contract drafting. Visit the [Contract Drafting page](/contracts?session=${contractSession.session_id}) to continue this contract.`,
                                    timestamp: new Date().toISOString(),
                                };
                                addMessage(activeConvId, assistantMessage);
                                activeConvId = await persistToolMessage(activeConvId, {
                                    role: "assistant",
                                    content: assistantMessage.content,
                                    metadata: {
                                        source: "chat_page",
                                        tool: "deep_research",
                                        redirect_tool: "draft_contract",
                                        contract_session_id: contractSession.session_id,
                                        message_kind: "tool_assistant_redirect",
                                    },
                                });
                                await syncPersistedConversation(activeConvId);
                                refreshEntitlements();
                            } catch (contractErr) {
                                const assistantMessage: ChatMessageType = {
                                    role: "assistant",
                                    content: `This query appears to be about contract drafting. Visit the [Contract Drafting page](/contracts?q=${encodeURIComponent(text)}) for a guided contract creation experience.`,
                                    timestamp: new Date().toISOString(),
                                };
                                addMessage(activeConvId, assistantMessage);
                                activeConvId = await persistToolMessage(activeConvId, {
                                    role: "assistant",
                                    content: assistantMessage.content,
                                    metadata: {
                                        source: "chat_page",
                                        tool: "deep_research",
                                        redirect_tool: "draft_contract",
                                        message_kind: "tool_assistant_redirect_fallback",
                                    },
                                });
                                await syncPersistedConversation(activeConvId);
                                console.error("Failed to create contract session from research redirect:", contractErr);
                            }
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
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "assistant",
                            content: assistantMessage.content,
                            metadata: {
                                source: "chat_page",
                                tool: "deep_research",
                                research_session_id: session.session_id,
                                research_status: session.status,
                                research_phase: session.phase,
                                message_kind: "tool_assistant_status",
                            },
                        });
                        await syncPersistedConversation(activeConvId);
                        setActiveToolExecution(null);
                        return;
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
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "user",
                            content: userMessage.content,
                            title: text,
                            metadata: {
                                source: "chat_page",
                                tool: "deep_research",
                                message_kind: "tool_user_prompt",
                            },
                        });
                        addMessage(activeConvId, errorMessage);
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "assistant",
                            content: errorMessage.content,
                            metadata: {
                                source: "chat_page",
                                tool: "deep_research",
                                message_kind: "tool_assistant_error",
                            },
                        });
                        await syncPersistedConversation(activeConvId);
                        return;
                    } finally {
                        setLoading(false);
                    }
                }

                // Draft Contract Tool
                if (activeTool === "draft-contract") {
                    setInput("");
                    setLoading(true);
                    let activeConvId = convId || createConversation();

                    const userMessage: ChatMessageType = {
                        role: "user",
                        content: `📄 **Draft Contract:** ${text}`,
                        timestamp: new Date().toISOString(),
                    };
                    addMessage(activeConvId, userMessage);

                    try {
                        const contractSession = await createContractSession({
                            contract_type: inferContractType(text),
                            description: text,
                        });
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "user",
                            content: userMessage.content,
                            title: text,
                            metadata: {
                                source: "chat_page",
                                tool: "draft_contract",
                                message_kind: "tool_user_prompt",
                            },
                        });
                        const assistantMessage: ChatMessageType = {
                            role: "assistant",
                            content: `I can help you draft a contract. Contract drafting requires gathering specific details about the parties and terms.\n\n**Your request:** ${text}\n\nTo continue this contract, visit the [Contract Drafting page](/contracts?session=${contractSession.session_id}).`,
                            timestamp: new Date().toISOString(),
                        };
                        addMessage(activeConvId, assistantMessage);
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "assistant",
                            content: assistantMessage.content,
                            metadata: {
                                source: "chat_page",
                                tool: "draft_contract",
                                contract_session_id: contractSession.session_id,
                                message_kind: "tool_assistant_status",
                            },
                        });
                        await syncPersistedConversation(activeConvId);
                        refreshEntitlements();
                        return;
                    } catch (err) {
                        if (err instanceof APIError && err.isFeatureGatingError()) {
                            const gatingDetails = err.getFeatureGatingDetails();
                            if (gatingDetails) {
                                showUpgradeModal(gatingDetails);
                                removeMessagesFrom(activeConvId, messagesForHistory?.length ?? 0);
                                return;
                            }
                        }
                        const assistantMessage: ChatMessageType = {
                            role: "assistant",
                            content: `I can help you draft a contract. Contract drafting requires gathering specific details about the parties and terms.\n\n**Your request:** ${text}\n\nTo create your contract with a guided process, visit the [Contract Drafting page](/contracts?q=${encodeURIComponent(text)}).`,
                            timestamp: new Date().toISOString(),
                        };
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "user",
                            content: userMessage.content,
                            title: text,
                            metadata: {
                                source: "chat_page",
                                tool: "draft_contract",
                                message_kind: "tool_user_prompt",
                            },
                        });
                        addMessage(activeConvId, assistantMessage);
                        activeConvId = await persistToolMessage(activeConvId, {
                            role: "assistant",
                            content: assistantMessage.content,
                            metadata: {
                                source: "chat_page",
                                tool: "draft_contract",
                                message_kind: "tool_assistant_fallback",
                            },
                        });
                        await syncPersistedConversation(activeConvId);
                        console.error("Failed to create contract session from chat tool:", err);
                        return;
                    } finally {
                        setLoading(false);
                    }
                }

                // Regular Chat
                const activeConvId = convId || createConversation();
                setInput("");
                await handleRegularChat(text, activeConvId, messagesForHistory);
            } finally {
                submissionInFlightRef.current = false;
            }
        },
        [
            isLoading,
            input,
            currentConversationId,
            createConversation,
            handleRegularChat,
            addMessage,
            setLoading,
            showUpgradeModal,
            removeMessagesFrom,
            persistToolMessage,
            syncPersistedConversation,
            refreshEntitlements,
        ]
    );

    // Initial Query Handler
    // When ?q= is present, always create a fresh conversation.
    // When ?doc= is also present, scope that conversation to the document
    // so the response is grounded in the actual source (like side-chat).
    const initialQueryHandledRef = useRef(false);
    useEffect(() => {
        if (!initialQuery || initialQueryHandledRef.current) return;
        initialQueryHandledRef.current = true;

        const id = createConversation();

        // If a document ID was provided, scope the conversation
        if (initialDocumentId) {
            const { conversations } = useChatStore.getState();
            const conv = conversations.find((c) => c.id === id);
            if (conv) {
                useChatStore.setState({
                    conversations: conversations.map((c) =>
                        c.id === id
                            ? { ...c, scope: { document_id: initialDocumentId, mode: "strict" as const } }
                            : c
                    ),
                });
            }
        }

        setInput(initialQuery);
        // Small timeout to ensure state updates propagate
        setTimeout(() => handleSend(initialQuery, id), 100);
    }, [initialQuery, initialDocumentId, createConversation, handleSend]);

    useEffect(() => {
        if (!initialConversationId) {
            return;
        }
        if (hydratedInitialConversationRef.current === initialConversationId) {
            return;
        }
        if (currentConversationId === initialConversationId) {
            hydratedInitialConversationRef.current = initialConversationId;
            return;
        }
        setCurrentConversation(initialConversationId);
        hydratedInitialConversationRef.current = initialConversationId;
        if (isAuthenticated) {
            fetchConversation(initialConversationId).catch(() => undefined);
        }
    }, [initialConversationId, currentConversationId, setCurrentConversation, isAuthenticated, fetchConversation]);

    const clearChatRouteParams = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (params.has("conversation")) {
            params.delete("conversation");
            changed = true;
        }
        if (params.has("q")) {
            params.delete("q");
            changed = true;
        }

        if (!changed) {
            return;
        }

        const nextQuery = params.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);


    // 4. Regenerate / Edit Wrappers
    const regenerateForMessage = useCallback(
        async (userContent: string, activeConvId: string, messagesBeforeUser: ChatMessageType[], truncateFrom?: number, skipAddUser?: boolean) => {
            if (!skipAddUser) {
                // Re-add the user message to local store (it was removed by handleRegenerate).
                // Skip when called from handleEditSubmit — editMessageAndTruncate already
                // placed the edited user message, so adding again would duplicate it.
                const userMessage: ChatMessageType = {
                    role: "user",
                    content: userContent,
                    timestamp: new Date().toISOString(),
                };
                addMessage(activeConvId, userMessage);
            }

            const conversationHistory = [
                ...messagesBeforeUser.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
                { role: "user", content: userContent },
            ];
            await streamResponse(userContent, activeConvId, conversationHistory, truncateFrom);
        },
        [streamResponse, addMessage]
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

        // Truncate from the edited message index in the backend too
        const truncateFrom = index;

        setTimeout(() => {
            // skipAddUser=true: editMessageAndTruncate already placed the user message
            regenerateForMessage(trimmedContent, convId, messagesIncludingEditedUser, truncateFrom, true);
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
        // Keep messages BEFORE the user message (not including it)
        // streamResponse will re-add both the user message and assistant response
        const messagesBeforeUser = currentConversation.messages.slice(0, userMessageIndex);
        const convId = currentConversationId;

        // Remove both the user message AND assistant message to avoid duplicates
        removeMessagesFrom(convId, userMessageIndex);

        // Pass truncate_from so the backend also deletes the old messages from DB
        const truncateFrom = userMessageIndex;

        setTimeout(() => {
            regenerateForMessage(userContent, convId, messagesBeforeUser, truncateFrom);
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
        clearChatRouteParams();
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
            isGenerating,
            isFetchingHistory,
            error,
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
            handleMessageFeedback,
        }
    };
}
