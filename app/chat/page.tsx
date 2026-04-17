"use client";

import { useState } from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChatInput,
  EmptyState,
  type ToolMode,
} from "@/components/chat";
import { CitationProvider } from "@/components/citations";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import { useChatOrchestrator } from "@/hooks/use-chat-orchestrator";

// Heavy components that only mount on a user action (open a conversation
// with messages, hit export, open shortcuts, toggle mobile history, hit
// an upgrade gate, click a citation). Dynamic-import so they don't land
// in the initial /chat bundle.
const VirtualizedMessageList = dynamic(
  () => import("@/components/chat/virtualized-message-list").then(m => ({ default: m.VirtualizedMessageList })),
  { ssr: false, loading: () => null }
);
const MobileHistorySheet = dynamic(
  () => import("@/components/chat/conversation-sidebar").then(m => ({ default: m.MobileHistorySheet })),
  { ssr: false, loading: () => null }
);
const KeyboardShortcutsDialog = dynamic(
  () => import("@/components/chat/keyboard-shortcuts-dialog").then(m => ({ default: m.KeyboardShortcutsDialog })),
  { ssr: false, loading: () => null }
);
const ExportDialog = dynamic(
  () => import("@/components/chat/export-dialog").then(m => ({ default: m.ExportDialog })),
  { ssr: false, loading: () => null }
);
const UpgradeRequiredModal = dynamic(
  () => import("@/components/entitlements/upgrade-required-modal").then(m => ({ default: m.UpgradeRequiredModal })),
  { ssr: false, loading: () => null }
);
const ResponsiveSourceView = dynamic(
  () => import("@/components/citations").then(m => ({ default: m.ResponsiveSourceView })),
  { ssr: false, loading: () => null }
);

function EmptyChatSurface({
  input,
  isLoading,
  isGenerating,
  onSelectQuestion,
  onSubmit,
  onStop,
  setInputRef,
}: {
  input: string;
  isLoading: boolean;
  isGenerating: boolean;
  onSelectQuestion: (question: string) => void;
  onSubmit: (value: string, tool: ToolMode) => void;
  onStop: (() => void) | undefined;
  setInputRef: (node: HTMLTextAreaElement | null) => void;
}) {
  const [tool, setTool] = useState<ToolMode>("chat");

  return (
    <EmptyState
      selectedTool={tool}
      onSelectQuestion={onSelectQuestion}
      composer={
        <ChatInput
          ref={setInputRef}
          value={input}
          selectedTool={tool}
          onSelectTool={setTool}
          onSubmit={onSubmit}
          isLoading={isLoading}
          isGenerating={isGenerating}
          onStop={onStop}
        />
      }
    />
  );
}

function ChatContent() {
  // Require authentication to access chat
  // canShowContent prevents flash of protected content during auth check or redirect
  const { canShowContent } = useRequireAuth();
  const { state, actions } = useChatOrchestrator();
  const {
    handleSelectConversation,
    handleRenameConversation,
    handleStarConversation,
    handleUnstarConversation,
    handleArchiveConversation,
    handleUnarchiveConversation,
    handleDeleteClick,
    handleNewConversation,
    setMobileHistoryOpen,
    handleSelectQuestion,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleEditSubmit,
    copyMessage,
    handleRegenerate,
    setDeleteDialogOpen,
    setShortcutsDialogOpen,
    setExportDialogOpen,
    handleConfirmDelete,
    hideUpgradeModal,
    handleStop,
    handleMessageFeedback,
    setInputRef,
    setEditInputRef,
  } = actions;

  // Show loading until authenticated - prevents flash of protected content
  if (!canShowContent) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <CitationProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex h-full flex-col md:flex-row">
          {/* Desktop Sidebar */}
          <ConversationSidebar
            conversations={state.conversations}
            archivedConversations={state.archivedConversations}
            currentConversationId={state.currentConversationId}
            isFetchingHistory={state.isFetchingHistory}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteClick}
            onRenameConversation={handleRenameConversation}
            onStarConversation={handleStarConversation}
            onUnstarConversation={handleUnstarConversation}
            onArchiveConversation={handleArchiveConversation}
            onUnarchiveConversation={handleUnarchiveConversation}
            onNewConversation={handleNewConversation}
          />

          {/* Chat Area */}
          <div className="flex flex-1 flex-col min-h-0">
            {/* Mobile Header — Compact for maximum chat space */}
            <div className="flex items-center justify-between border-b px-3 py-2 md:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {/* Eyebrow label, not the page's semantic heading —
                    EmptyState owns the <h1>. */}
                <span className="text-sm font-semibold">Legal Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNewConversation}
                  aria-label="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <MobileHistorySheet
                  open={state.mobileHistoryOpen}
                  onOpenChange={setMobileHistoryOpen}
                  conversations={state.conversations}
                  archivedConversations={state.archivedConversations}
                  currentConversationId={state.currentConversationId}
                  isFetchingHistory={state.isFetchingHistory}
                  onSelectConversation={handleSelectConversation}
                  onDeleteConversation={handleDeleteClick}
                  onRenameConversation={handleRenameConversation}
                  onStarConversation={handleStarConversation}
                  onUnstarConversation={handleUnstarConversation}
                  onArchiveConversation={handleArchiveConversation}
                  onUnarchiveConversation={handleUnarchiveConversation}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden min-h-0" role="region" aria-label="Chat messages" aria-live="polite">
              {state.currentConversation?.scope && (
                <div className="border-b bg-muted/30 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary">Scoped chat</Badge>
                    <span className="font-medium">This conversation is pinned to one document.</span>
                    <span className="text-muted-foreground">
                      Document ID: {state.currentConversation.scope.document_id}
                    </span>
                  </div>
                </div>
              )}
              {!state.currentConversation || state.currentConversation.messages.length === 0 ? (
                <div className="h-full overflow-y-auto">
                  <div className="h-full">
                    <EmptyChatSurface
                      input={state.input}
                      isLoading={state.isLoading}
                      isGenerating={state.isGenerating}
                      onSelectQuestion={handleSelectQuestion}
                      onSubmit={(value, tool) => handleSend(value, undefined, undefined, tool)}
                      onStop={handleStop}
                      setInputRef={setInputRef}
                    />
                  </div>
                </div>
              ) : (
                <VirtualizedMessageList
                  messages={state.currentConversation.messages}
                  isLoading={state.isLoading}
                  isGenerating={state.isGenerating}
                  error={state.error}
                  editingIndex={state.editingIndex}
                  copiedId={state.copiedId}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditSubmit={handleEditSubmit}
                  onCopy={copyMessage}
                  onRegenerate={handleRegenerate}
                  onSelectFollowup={handleSelectQuestion}
                  onFeedback={handleMessageFeedback}
                  onExport={() => setExportDialogOpen(true)}
                  editInputRef={setEditInputRef}
                />
              )}
            </div>

            {/* Input Area */}
            {state.currentConversation && state.currentConversation.messages.length > 0 && (
              <ChatInput
                ref={setInputRef}
                value={state.input}
                onSubmit={(value, tool) => handleSend(value, undefined, undefined, tool)}
                isLoading={state.isLoading}
                isGenerating={state.isGenerating}
                onStop={handleStop}
              />
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={state.deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Upgrade Required Modal for Feature Gating */}
          <UpgradeRequiredModal
            open={state.upgradeModalOpen}
            onClose={hideUpgradeModal}
            details={state.upgradeDetails}
          />

          {/* Keyboard Shortcuts Dialog */}
          <KeyboardShortcutsDialog
            open={state.shortcutsDialogOpen}
            onOpenChange={setShortcutsDialogOpen}
          />

          {/* Export Dialog */}
          <ExportDialog
            open={state.exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            conversation={state.currentConversation}
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
          <div className="flex h-full items-center justify-center">
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
