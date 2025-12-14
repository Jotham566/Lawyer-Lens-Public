"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  FileText,
  Scale,
  BookOpen,
  Sparkles,
  Plus,
  Library,
  HelpCircle,
  Moon,
  Sun,
  Home,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "next-themes";
import { getModifierKey } from "@/lib/hooks/use-keyboard-shortcuts";

interface CommandPaletteProps {
  onNewChat?: () => void;
}

export function CommandPalette({ onNewChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const modKey = getModifierKey();

  // Global keyboard shortcut for opening command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      runCommand(() => router.push(path));
    },
    [router, runCommand]
  );

  const handleNewChat = useCallback(() => {
    if (onNewChat) {
      runCommand(onNewChat);
    } else {
      navigateTo("/chat");
    }
  }, [onNewChat, navigateTo, runCommand]);

  const toggleTheme = useCallback(() => {
    runCommand(() => setTheme(theme === "dark" ? "light" : "dark"));
  }, [theme, setTheme, runCommand]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>{modKey}N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/search")}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Documents</span>
            <CommandShortcut>{modKey}S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/research")}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>New Research</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigateTo("/")}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/chat")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Legal Assistant</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/browse")}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Browse Documents</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/library")}>
            <Library className="mr-2 h-4 w-4" />
            <span>My Library</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Document Types">
          <CommandItem onSelect={() => navigateTo("/legislation/acts")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Acts of Parliament</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/judgments")}>
            <Scale className="mr-2 h-4 w-4" />
            <span>Court Judgments</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/legislation/regulations")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Regulations</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/legislation/constitution")}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Constitution</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/help")}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Keyboard shortcut hint component for displaying in the UI
 */
export function KeyboardShortcutHint({
  shortcut,
  className,
}: {
  shortcut: string;
  className?: string;
}) {
  return (
    <kbd
      className={`pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ${className || ""}`}
    >
      {shortcut}
    </kbd>
  );
}
