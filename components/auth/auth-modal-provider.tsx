"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthModal, type AuthView } from "./auth-modal";

// Storage key for return URL
const RETURN_URL_KEY = "auth_return_url";

interface AuthModalContextType {
  openAuthModal: (view?: AuthView, returnUrl?: string) => void;
  closeAuthModal: () => void;
  openLogin: (returnUrl?: string) => void;
  openRegister: (returnUrl?: string) => void;
  openForgotPassword: () => void;
  isOpen: boolean;
  setReturnUrl: (url: string) => void;
  getReturnUrl: () => string | null;
  clearReturnUrl: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [defaultView, setDefaultView] = useState<AuthView>("login");

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

  const openAuthModal = useCallback((view: AuthView = "login", returnUrl?: string) => {
    if (returnUrl) {
      setReturnUrl(returnUrl);
    }
    setDefaultView(view);
    setIsOpen(true);
  }, [setReturnUrl]);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openLogin = useCallback((returnUrl?: string) => openAuthModal("login", returnUrl), [openAuthModal]);
  const openRegister = useCallback((returnUrl?: string) => openAuthModal("register", returnUrl), [openAuthModal]);
  const openForgotPassword = useCallback(() => openAuthModal("forgot-password"), [openAuthModal]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setIsOpen(false);
    const returnUrl = getReturnUrl();
    clearReturnUrl();

    if (returnUrl && returnUrl !== "/" && returnUrl !== "/login" && returnUrl !== "/register") {
      router.push(returnUrl);
    } else {
      // Default redirect to dashboard for new users
      router.push("/dashboard");
    }
  }, [router, getReturnUrl, clearReturnUrl]);

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
