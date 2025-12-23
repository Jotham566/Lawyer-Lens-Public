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
  const { isLoading: authLoading } = useRequireAuth();
  const { state, refs, actions } = useChatOrchestrator();

  // Show loading while checking auth
  if (authLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <CitationProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)] md:flex-row lg:h-[calc(100vh-4rem)]">
          {/* Desktop Sidebar */}
          <ConversationSidebar
            conversations={state.conversations}
            currentConversationId={state.currentConversationId}
            onSelectConversation={actions.handleSelectConversation}
            onDeleteConversation={actions.handleDeleteClick}
            onNewConversation={actions.handleNewConversation}
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
                  onClick={actions.handleNewConversation}
                  aria-label="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <MobileHistorySheet
                  open={state.mobileHistoryOpen}
                  onOpenChange={actions.setMobileHistoryOpen}
                  conversations={state.conversations}
                  currentConversationId={state.currentConversationId}
                  onSelectConversation={actions.handleSelectConversation}
                  onDeleteConversation={actions.handleDeleteClick}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden" role="region" aria-label="Chat messages">
              {!state.currentConversation || state.currentConversation.messages.length === 0 ? (
                <div className="h-full overflow-y-auto">
                  <div className="mx-auto max-w-3xl px-4 py-6">
                    <EmptyState
                      selectedTool={state.selectedTool}
                      onClearTool={() => actions.setSelectedTool("chat")}
                      onSelectQuestion={actions.handleSelectQuestion}
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
                  onStartEdit={actions.handleStartEdit}
                  onCancelEdit={actions.handleCancelEdit}
                  onEditSubmit={actions.handleEditSubmit}
                  onCopy={actions.copyMessage}
                  onRegenerate={actions.handleRegenerate}
                  onSelectFollowup={actions.handleSelectQuestion}
                  editInputRef={refs.editInputRef}
                />
              )}
            </div>

            {/* Input Area */}
            <ChatInput
              ref={refs.inputRef}
              value={state.input}
              onChange={actions.handleInputChange}
              onKeyDown={actions.handleKeyDown}
              onSubmit={() => actions.handleSend()}
              isLoading={state.isLoading}
              selectedTool={state.selectedTool}
              onSelectTool={actions.setSelectedTool}
            />
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={state.deleteDialogOpen} onOpenChange={actions.setDeleteDialogOpen}>
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
                  onClick={actions.handleConfirmDelete}
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
            onClose={actions.hideUpgradeModal}
            details={state.upgradeDetails}
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
