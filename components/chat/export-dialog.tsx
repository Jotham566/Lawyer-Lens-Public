"use client";

import { useState } from "react";
import { FileText, FileDown, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/stores/chat-store";
import {
  exportToMarkdown,
  exportToText,
  downloadFile,
  generateFilename,
  printConversation,
} from "@/lib/utils/export-conversation";

type ExportFormat = "markdown" | "text" | "pdf";

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const exportOptions: ExportOption[] = [
  {
    id: "markdown",
    label: "Markdown",
    description: "Formatted text with headers and styling",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "text",
    label: "Plain Text",
    description: "Simple text without formatting",
    icon: <FileDown className="h-5 w-5" />,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Print-ready document format",
    icon: <Printer className="h-5 w-5" />,
  },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
}

export function ExportDialog({
  open,
  onOpenChange,
  conversation,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!conversation) return;

    setIsExporting(true);

    try {
      switch (selectedFormat) {
        case "markdown": {
          const content = exportToMarkdown(conversation);
          const filename = generateFilename(conversation.title, "md");
          downloadFile(content, filename, "text/markdown");
          break;
        }
        case "text": {
          const content = exportToText(conversation);
          const filename = generateFilename(conversation.title, "txt");
          downloadFile(content, filename, "text/plain");
          break;
        }
        case "pdf": {
          printConversation(conversation);
          break;
        }
      }

      // Close dialog after successful export (except PDF which opens print dialog)
      if (selectedFormat !== "pdf") {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const messageCount = conversation?.messages.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Conversation</DialogTitle>
          <DialogDescription>
            Choose a format to export this conversation ({messageCount} messages)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedFormat(option.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                selectedFormat === option.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "mt-0.5",
                  selectedFormat === option.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "font-medium text-sm",
                    selectedFormat === option.id
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </div>
              </div>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center",
                  selectedFormat === option.id
                    ? "border-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedFormat === option.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !conversation}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
