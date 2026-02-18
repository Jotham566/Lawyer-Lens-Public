"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  getCurrentUser,
  issueCsrfToken,
  type User,
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
} from "@/lib/api/auth";
import { onUnauthorized } from "@/lib/api/client";
import { useChatStore } from "@/lib/stores/chat-store";

const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ requiresVerification: boolean }>;
  register: (data: RegisterRequest) => Promise<{ emailSent: boolean }>;
  loginWithOAuth: (response: LoginResponse) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Refresh session - returns true if successful
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      await issueCsrfToken();
      await apiRefreshToken();
      const user = await getCurrentUser();
      await issueCsrfToken();

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });

      // Set userId in chat store for user-scoped chat history
      useChatStore.getState().setUserId(user.id);

      return true;
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      // Clear userId in chat store
      useChatStore.getState().setUserId(null);
      return false;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const user = await getCurrentUser();
        await issueCsrfToken();
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        // Set userId in chat store for user-scoped chat history
        useChatStore.getState().setUserId(user.id);
      } catch {
        // Token might be invalid, try refresh
        await refreshSession();
      }
    }

    initAuth();
  }, [refreshSession]);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated) return;
    const interval = setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshSession]);

  // Subscribe to 401 unauthorized events for auto-logout
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      void (async () => {
        const ok = await refreshSession();
        if (ok) {
          return;
        }
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        useChatStore.getState().setUserId(null);
        router.push("/");
      })();
    });

    return unsubscribe;
  }, [refreshSession, router]);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);

    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });

    void issueCsrfToken();
    // Set userId in chat store for user-scoped chat history
    useChatStore.getState().setUserId(response.user.id);

    return { requiresVerification: response.requires_email_verification };
  }, []);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);

    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });

    void issueCsrfToken();
    // Set userId in chat store for user-scoped chat history
    useChatStore.getState().setUserId(response.user.id);

    return { emailSent: response.email_verification_sent };
  }, []);

  // OAuth Login - for handling OAuth callback
  const loginWithOAuth = useCallback((response: LoginResponse) => {
    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });

    void issueCsrfToken();
    // Set userId in chat store for user-scoped chat history
    useChatStore.getState().setUserId(response.user.id);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    // Clear local state immediately for better UX
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    // Clear userId in chat store (clears chat history for this session)
    useChatStore.getState().setUserId(null);

    // Then call API (fire and forget)
    try {
      await apiLogout();
    } catch {
      // Ignore logout errors
    }

    // Redirect to home
    router.push("/");
  }, [router]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      loginWithOAuth,
      logout,
      refreshSession,
    }),
    [state, login, register, loginWithOAuth, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 * Preserves full URL including query params (e.g., /chat?q=search+term)
 *
 * Returns:
 * - isLoading: true while auth state is being determined
 * - isAuthenticated: true if user is logged in
 * - canShowContent: true only when auth check complete AND user is authenticated
 *   (use this to prevent flash of protected content during redirect)
 */
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination including query params
      // Use window.location.search to capture query string (e.g., ?q=search+term)
      const searchParams = typeof window !== "undefined" ? window.location.search : "";
      const fullPath = pathname + searchParams;
      const returnUrl = encodeURIComponent(fullPath);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isLoading, isAuthenticated, router, pathname, redirectTo]);

  // canShowContent prevents flash of protected content:
  // - false while loading (checking auth)
  // - false while not authenticated (redirecting to login)
  // - true only when authenticated
  const canShowContent = !isLoading && isAuthenticated;

  return { isAuthenticated, isLoading, canShowContent };
}

/**
 * Hook for auth pages - redirects to home if already authenticated
 */
export function useRedirectIfAuthenticated(redirectTo = "/") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
