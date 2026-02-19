"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Detect if user is on Mac
const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: [isMac ? "⌘" : "Ctrl", "N"], description: "New conversation" },
  { keys: ["Enter"], description: "Send message" },
  { keys: ["Shift", "Enter"], description: "New line in message" },
  { keys: ["Esc"], description: "Cancel edit / Close dialogs" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[24px] h-6 px-1.5",
        "rounded border border-border bg-muted/50",
        "text-xs font-mono font-medium text-muted-foreground",
        "shadow-sm"
      )}
    >
      {children}
    </kbd>
  );
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-foreground">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1">
                    <KeyboardKey>{key}</KeyboardKey>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Press <KeyboardKey>?</KeyboardKey> anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
