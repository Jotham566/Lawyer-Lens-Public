"use client";

import { Suspense } from "react";
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
  KeyboardShortcutsDialog,
  ExportDialog,
} from "@/components/chat";
import { CitationProvider, ResponsiveSourceView } from "@/components/citations";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";
import {
  UpgradeRequiredModal,
} from "@/components/entitlements/upgrade-required-modal";
import { useChatOrchestrator } from "@/hooks/use-chat-orchestrator";

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
    setSelectedTool,
    handleInputChange,
    handleKeyDown,
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
                <h1 className="text-sm font-semibold">Legal Assistant</h1>
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
              {!state.currentConversation || state.currentConversation.messages.length === 0 ? (
                <div className="h-full overflow-y-auto">
                  <div className="mx-auto max-w-3xl px-4 py-6">
                    <EmptyState
                      selectedTool={state.selectedTool}
                      onClearTool={() => setSelectedTool("chat")}
                      onSelectTool={setSelectedTool}
                      onSelectQuestion={handleSelectQuestion}
                    />
                  </div>
                </div>
              ) : (
                <VirtualizedMessageList
                  messages={state.currentConversation.messages}
                  isLoading={state.isLoading}
                  error={state.error}
                  editingIndex={state.editingIndex}
                  copiedId={state.copiedId}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditSubmit={handleEditSubmit}
                  onCopy={copyMessage}
                  onRegenerate={handleRegenerate}
                  onSelectFollowup={handleSelectQuestion}
                  onExport={() => setExportDialogOpen(true)}
                  editInputRef={setEditInputRef}
                />
              )}
            </div>

            {/* Input Area */}
            <ChatInput
              ref={setInputRef}
              value={state.input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSubmit={() => handleSend()}
              isLoading={state.isLoading}
              onStop={handleStop}
              selectedTool={state.selectedTool}
              onSelectTool={setSelectedTool}
            />
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
