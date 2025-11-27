/**
 * UI Store
 *
 * Global state for UI elements using Zustand.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
}

interface CommandPaletteState {
  isOpen: boolean;
}

interface UIState {
  // Sidebar
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command Palette
  commandPalette: CommandPaletteState;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Document viewer
  documentFontSize: "small" | "medium" | "large";
  setDocumentFontSize: (size: "small" | "medium" | "large") => void;

  // Search mode preference
  preferredSearchMode: "keyword" | "semantic" | "hybrid";
  setPreferredSearchMode: (mode: "keyword" | "semantic" | "hybrid") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar state
      sidebar: {
        isOpen: true,
        isCollapsed: false,
      },
      toggleSidebar: () =>
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
        })),
      setSidebarOpen: (open) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: open },
        })),
      setSidebarCollapsed: (collapsed) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: collapsed },
        })),

      // Command Palette state
      commandPalette: {
        isOpen: false,
      },
      toggleCommandPalette: () =>
        set((state) => ({
          commandPalette: { isOpen: !state.commandPalette.isOpen },
        })),
      setCommandPaletteOpen: (open) =>
        set({ commandPalette: { isOpen: open } }),

      // Document viewer settings
      documentFontSize: "medium",
      setDocumentFontSize: (size) => set({ documentFontSize: size }),

      // Search mode preference
      preferredSearchMode: "hybrid",
      setPreferredSearchMode: (mode) => set({ preferredSearchMode: mode }),
    }),
    {
      name: "lawyer-lens-ui",
      partialize: (state) => ({
        sidebar: state.sidebar,
        documentFontSize: state.documentFontSize,
        preferredSearchMode: state.preferredSearchMode,
      }),
    }
  )
);
