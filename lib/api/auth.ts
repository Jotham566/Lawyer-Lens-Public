/**
 * Authentication API client
 *
 * Provides typed API calls for authentication endpoints.
 */

import { apiFetch, apiUpload } from "./client";

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  email_verified: boolean;
  auth_provider: "email" | "google" | "microsoft";
  default_organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_agent?: string;
  ip_address?: string;
  device_info?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  is_current: boolean;
  last_activity_at?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  session_id: string;
  requires_email_verification: boolean;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  session_id: string;
  email_verification_sent: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  invitation_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  default_organization_id?: string;
}

export interface VerifyEmailRequest {
  token: string;
}


export interface CsrfTokenResponse {
  csrf_token: string;
}

// Auth API functions

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", {
    method: "POST",
  });
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  return apiFetch<RefreshTokenResponse>("/auth/refresh", {
    method: "POST",
  });
}

/**
 * Issue CSRF token for cookie-based auth
 */
export async function issueCsrfToken(): Promise<CsrfTokenResponse> {
  return apiFetch<CsrfTokenResponse>("/auth/csrf", {
    method: "GET",
  });
}

/**
 * Verify email address
 */
export async function verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/resend-verification", {
    method: "POST",
  });
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Change password (authenticated)
 */
export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/auth/me", {
    method: "GET",
  });
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return apiFetch<User>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Get active sessions
 */
export async function getSessions(): Promise<UserSession[]> {
  const response = await apiFetch<{ sessions: UserSession[] }>("/auth/sessions", {
    method: "GET",
  });
  return response.sessions;
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

/**
 * Revoke all other sessions
 */
export async function revokeAllSessions(): Promise<{ message: string; revoked_count: number }> {
  return apiFetch<{ message: string; revoked_count: number }>("/auth/sessions", {
    method: "DELETE",
  });
}

// ============================================================================
// Avatar
// ============================================================================

export interface AvatarUploadResponse {
  avatar_url: string;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  return apiUpload<AvatarUploadResponse>("/auth/avatar", file, "avatar");
}

/**
 * Delete avatar image
 */
export async function deleteAvatar(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/avatar", {
    method: "DELETE",
  });
}

// ============================================================================
// Account Deletion
// ============================================================================

export interface DeleteAccountRequest {
  password: string;
  confirmation: string; // User types "DELETE" to confirm
}

/**
 * Delete user account (requires password confirmation)
 */
export async function deleteAccount(data: DeleteAccountRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/account", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// OAuth
// ============================================================================

export type OAuthProvider = "google" | "microsoft";

export interface OAuthUrlResponse {
  authorization_url: string;
  state: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

/**
 * Get OAuth authorization URL
 */
export async function getOAuthUrl(provider: OAuthProvider): Promise<OAuthUrlResponse> {
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback/${provider}`
    : "";

  return apiFetch<OAuthUrlResponse>(`/auth/oauth/${provider}/authorize`, {
    method: "POST",
    body: JSON.stringify({ redirect_uri: redirectUri }),
  });
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  data: OAuthCallbackRequest
): Promise<LoginResponse> {
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback/${provider}`
    : "";

  return apiFetch<LoginResponse>(`/auth/oauth/${provider}/callback`, {
    method: "POST",
    body: JSON.stringify({ ...data, redirect_uri: redirectUri }),
  });
}

/**
 * Initiate OAuth login by redirecting to provider
 * @param provider - OAuth provider (google or microsoft)
 * @param returnUrl - Optional URL to redirect to after authentication
 */
export async function initiateOAuth(provider: OAuthProvider, returnUrl?: string): Promise<void> {
  const { authorization_url, state } = await getOAuthUrl(provider);

  // Store state for verification on callback
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_state", state);
    sessionStorage.setItem("oauth_provider", provider);
    // Preserve return URL for post-auth redirect
    if (returnUrl) {
      sessionStorage.setItem("oauth_return_url", returnUrl);
    } else {
      // Check if there's already a return URL stored by auth modal
      const existingReturnUrl = sessionStorage.getItem("auth_return_url");
      if (existingReturnUrl) {
        sessionStorage.setItem("oauth_return_url", existingReturnUrl);
      }
    }
    window.location.href = authorization_url;
  }
}
