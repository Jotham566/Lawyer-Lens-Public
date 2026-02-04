"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthModal, type AuthView } from "./auth-modal";

// Storage keys
const RETURN_URL_KEY = "auth_return_url";
const INVITATION_TOKEN_KEY = "auth_invitation_token";
const DEFAULT_VIEW_KEY = "auth_default_view";

interface AuthModalContextType {
  openAuthModal: (view?: AuthView, returnUrl?: string) => void;
  closeAuthModal: () => void;
  openLogin: (returnUrl?: string) => void;
  openRegister: (returnUrl?: string, invitationToken?: string) => void;
  openForgotPassword: () => void;
  isOpen: boolean;
  setReturnUrl: (url: string) => void;
  getReturnUrl: () => string | null;
  clearReturnUrl: () => void;
  setInvitationToken: (token: string) => void;
  getInvitationToken: () => string | null;
  clearInvitationToken: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Initialize defaultView from sessionStorage if present
  const [defaultView, setDefaultView] = useState<AuthView>(() => {
    if (typeof window === "undefined") return "login";
    const stored = sessionStorage.getItem(DEFAULT_VIEW_KEY) as AuthView | null;
    return stored || "login";
  });

  // Return URL management
  const setReturnUrl = useCallback((url: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(RETURN_URL_KEY, url);
    }
  }, []);

  const getReturnUrl = useCallback(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(RETURN_URL_KEY);
  }, []);

  const clearReturnUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(RETURN_URL_KEY);
    }
  }, []);

  // Invitation token management
  const setInvitationToken = useCallback((token: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(INVITATION_TOKEN_KEY, token);
    }
  }, []);

  const getInvitationToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(INVITATION_TOKEN_KEY);
  }, []);

  const clearInvitationToken = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(INVITATION_TOKEN_KEY);
    }
  }, []);

  const openAuthModal = useCallback((view: AuthView = "login", returnUrl?: string) => {
    console.log('[AuthModal] openAuthModal setting view to:', view);
    if (returnUrl) {
      setReturnUrl(returnUrl);
    }
    // Persist view to sessionStorage so it survives redirects
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DEFAULT_VIEW_KEY, view);
    }
    setDefaultView(view);
    setIsOpen(true);
  }, [setReturnUrl]);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    // Clear stored view when closing
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DEFAULT_VIEW_KEY);
    }
  }, []);

  const openLogin = useCallback((returnUrl?: string) => openAuthModal("login", returnUrl), [openAuthModal]);
  const openRegister = useCallback((returnUrl?: string, invitationToken?: string) => {
    console.log('[AuthModal] openRegister called', { returnUrl, hasToken: !!invitationToken });
    if (invitationToken) {
      console.log('[AuthModal] Storing invitation token in sessionStorage');
      setInvitationToken(invitationToken);
    }
    openAuthModal("register", returnUrl);
  }, [openAuthModal, setInvitationToken]);
  const openForgotPassword = useCallback(() => openAuthModal("forgot-password"), [openAuthModal]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setIsOpen(false);
    const returnUrl = getReturnUrl();
    clearReturnUrl();
    clearInvitationToken(); // Clear invitation token after successful registration

    // Clear stored view
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DEFAULT_VIEW_KEY);
    }

    if (returnUrl && returnUrl !== "/" && returnUrl !== "/login" && returnUrl !== "/register") {
      router.push(returnUrl);
    } else {
      // Default redirect to dashboard for new users
      router.push("/dashboard");
    }
  }, [router, getReturnUrl, clearReturnUrl, clearInvitationToken]);

  return (
    <AuthModalContext.Provider
      value={{
        openAuthModal,
        closeAuthModal,
        openLogin,
        openRegister,
        openForgotPassword,
        isOpen,
        setReturnUrl,
        getReturnUrl,
        clearReturnUrl,
        setInvitationToken,
        getInvitationToken,
        clearInvitationToken,
      }}
    >
      {children}
      <AuthModal
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultView={defaultView}
        onSuccess={handleAuthSuccess}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
