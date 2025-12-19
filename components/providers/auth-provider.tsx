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
  type User,
  type AuthTokens,
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
} from "@/lib/api/auth";
import { onUnauthorized } from "@/lib/api/client";
import { useChatStore } from "@/lib/stores/chat-store";

// Token storage keys
const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ requiresVerification: boolean }>;
  register: (data: RegisterRequest) => Promise<{ emailSent: boolean }>;
  loginWithOAuth: (response: LoginResponse) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token helpers
function getStoredTokens(): { accessToken: string | null; refreshToken: string | null; expiry: number | null } {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, expiry: null };
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  return {
    accessToken,
    refreshToken,
    expiry: expiry ? parseInt(expiry, 10) : null,
  };
}

function setStoredTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  const expiry = Date.now() + tokens.expires_in * 1000;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
}

function clearStoredTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

function isTokenExpired(expiry: number | null): boolean {
  if (!expiry) return true;
  // Consider token expired 1 minute before actual expiry
  return Date.now() > expiry - 60000;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    accessToken: null,
  });

  // Refresh session - returns true if successful
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const { refreshToken } = getStoredTokens();

    if (!refreshToken) {
      return false;
    }

    try {
      const tokens = await apiRefreshToken({ refresh_token: refreshToken });
      setStoredTokens(tokens);

      const user = await getCurrentUser(tokens.access_token);

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        accessToken: tokens.access_token,
      });

      // Set userId in chat store for user-scoped chat history
      useChatStore.getState().setUserId(user.id);

      return true;
    } catch {
      clearStoredTokens();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
      });
      // Clear userId in chat store
      useChatStore.getState().setUserId(null);
      return false;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    async function initAuth() {
      const { accessToken, refreshToken, expiry } = getStoredTokens();

      // No tokens stored
      if (!accessToken || !refreshToken) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          accessToken: null,
        });
        return;
      }

      // Token expired, try to refresh
      if (isTokenExpired(expiry)) {
        await refreshSession();
        return;
      }

      // Token still valid, fetch user
      try {
        const user = await getCurrentUser(accessToken);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          accessToken,
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

    const { expiry } = getStoredTokens();
    if (!expiry) return;

    // Refresh 2 minutes before expiry
    const refreshTime = expiry - Date.now() - 120000;

    const timeout = setTimeout(() => {
      void refreshSession();
    }, Math.max(0, refreshTime));

    return () => clearTimeout(timeout);
  }, [state.isAuthenticated, refreshSession]);

  // Subscribe to 401 unauthorized events for auto-logout
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      // Clear auth state without calling API (token is already invalid)
      clearStoredTokens();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
      });
      // Redirect to home - user will see login prompt
      router.push("/");
    });

    return unsubscribe;
  }, [router]);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);

    setStoredTokens(response.tokens);

    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
      accessToken: response.tokens.access_token,
    });

    // Set userId in chat store for user-scoped chat history
    useChatStore.getState().setUserId(response.user.id);

    return { requiresVerification: response.requires_email_verification };
  }, []);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);

    setStoredTokens(response.tokens);

    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
      accessToken: response.tokens.access_token,
    });

    // Set userId in chat store for user-scoped chat history
    useChatStore.getState().setUserId(response.user.id);

    return { emailSent: response.email_verification_sent };
  }, []);

  // OAuth Login - for handling OAuth callback
  const loginWithOAuth = useCallback((response: LoginResponse) => {
    setStoredTokens(response.tokens);

    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
      accessToken: response.tokens.access_token,
    });

    // Set userId in chat store for user-scoped chat history
    useChatStore.getState().setUserId(response.user.id);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    const { accessToken } = getStoredTokens();

    // Clear local state immediately for better UX
    clearStoredTokens();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      accessToken: null,
    });

    // Clear userId in chat store (clears chat history for this session)
    useChatStore.getState().setUserId(null);

    // Then call API (fire and forget)
    if (accessToken) {
      try {
        await apiLogout(accessToken);
      } catch {
        // Ignore logout errors
      }
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

  return { isAuthenticated, isLoading };
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
