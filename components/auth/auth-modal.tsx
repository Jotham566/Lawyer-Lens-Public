"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers";
import { forgotPassword, initiateOAuth, OAuthProvider } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";
import { AlertBanner } from "@/components/common";

// ============================================================================
// Social Login Icons
// ============================================================================

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4 11.4H2V2h9.4v9.4z" fill="#F25022"/>
      <path d="M22 11.4h-9.4V2H22v9.4z" fill="#7FBA00"/>
      <path d="M11.4 22H2v-9.4h9.4V22z" fill="#00A4EF"/>
      <path d="M22 22h-9.4v-9.4H22V22z" fill="#FFB900"/>
    </svg>
  );
}

// ============================================================================
// Social Login Buttons
// ============================================================================

interface SocialLoginButtonsProps {
  mode: "login" | "register";
  disabled?: boolean;
  onError?: (error: string) => void;
}

function SocialLoginButtons({ mode, disabled, onError }: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    if (loading || disabled) return;

    setLoading(provider);
    try {
      await initiateOAuth(provider);
    } catch (error) {
      setLoading(null);
      if (error instanceof APIError) {
        onError?.(error.message || `Failed to connect to ${provider}`);
      } else {
        onError?.(`Failed to connect to ${provider}. Please try again.`);
      }
    }
  };

  const actionText = mode === "login" ? "Sign in" : "Sign up";

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth("google")}
        disabled={disabled || loading !== null}
      >
        {loading === "google" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        {actionText} with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth("microsoft")}
        disabled={disabled || loading !== null}
      >
        {loading === "microsoft" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MicrosoftIcon className="mr-2 h-4 w-4" />
        )}
        {actionText} with Microsoft
      </Button>
    </div>
  );
}

function OrDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>
    </div>
  );
}

// ============================================================================
// Types & Schemas
// ============================================================================

export type AuthView = "login" | "register" | "forgot-password";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean(),
});

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// Password Strength Indicator
// ============================================================================

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {checks.map((check) => (
        <div
          key={check.label}
          className={`flex items-center gap-1 text-xs ${
            check.valid
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          }`}
        >
          {check.valid ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <div className="h-3 w-3 rounded-full border" />
          )}
          {check.label}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Login View
// ============================================================================

interface LoginViewProps {
  onSwitchView: (view: AuthView) => void;
  onSuccess: () => void;
}

function LoginView({ onSwitchView, onSuccess }: LoginViewProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      const result = await login(data);

      if (result.requiresVerification) {
        router.push("/verify-email?pending=true");
        onSuccess();
      } else {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.errorCode === "INVALID_CREDENTIALS") {
          setError("Invalid email or password");
        } else if (err.errorCode === "ACCOUNT_LOCKED") {
          setError("Account temporarily locked. Please try again later.");
        } else if (err.errorCode === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email address before logging in.");
        } else {
          setError(err.message || "Login failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <DialogHeader className="space-y-2 pb-4">
        <DialogTitle className="text-xl">Welcome back</DialogTitle>
        <DialogDescription>
          Sign in to your Law Lens account to continue
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {error && (
          <AlertBanner variant="error" message={error} />
        )}

        <SocialLoginButtons
          mode="login"
          disabled={isSubmitting}
          onError={setError}
        />

        <OrDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">

        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              autoComplete="email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button
              type="button"
              onClick={() => onSwitchView("forgot-password")}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="remember_me"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="remember-me"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label
            htmlFor="remember-me"
            className="text-sm font-normal text-muted-foreground cursor-pointer"
          >
            Remember me for 30 days
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitchView("register")}
            className="text-primary hover:underline"
          >
            Create an account
          </button>
        </p>
      </form>
    </>
  );
}

// ============================================================================
// Register View
// ============================================================================

interface RegisterViewProps {
  onSwitchView: (view: AuthView) => void;
  onSuccess: () => void;
}

function RegisterView({ onSwitchView, onSuccess }: RegisterViewProps) {
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });

      if (result.emailSent) {
        router.push("/verify-email?pending=true");
        onSuccess();
      } else {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.errorCode === "USER_EXISTS") {
          setError("An account with this email already exists.");
        } else {
          setError(err.message || "Registration failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <DialogHeader className="space-y-2 pb-4">
        <DialogTitle className="text-xl">Create an account</DialogTitle>
        <DialogDescription>
          Get started with Law Lens for free
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {error && (
          <AlertBanner variant="error" message={error} />
        )}

        <SocialLoginButtons
          mode="register"
          disabled={isSubmitting}
          onError={setError}
        />

        <OrDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-name"
              type="text"
              placeholder="John Doe"
              className="pl-10"
              autoComplete="name"
              {...register("full_name")}
            />
          </div>
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              autoComplete="email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pl-10 pr-10"
              autoComplete="new-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          <PasswordStrength password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-confirm"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className="pl-10 pr-10"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitchView("login")}
            className="text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    </>
  );
}

// ============================================================================
// Forgot Password View
// ============================================================================

interface ForgotPasswordViewProps {
  onSwitchView: (view: AuthView) => void;
}

function ForgotPasswordView({ onSwitchView }: ForgotPasswordViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);

    try {
      await forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (err) {
      // Show success even for non-existent emails to prevent enumeration
      if (err instanceof APIError && err.status === 404) {
        setSubmittedEmail(data.email);
        setSuccess(true);
      } else if (err instanceof APIError) {
        setError(err.message || "Failed to send reset email. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  if (success) {
    return (
      <>
        <DialogHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl">Check your email</DialogTitle>
          <DialogDescription>
            If an account exists for <span className="font-medium">{submittedEmail}</span>,
            you will receive a password reset link shortly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Didn&apos;t receive the email?</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccess(false);
              setSubmittedEmail("");
            }}
          >
            Try a different email
          </Button>

          <button
            type="button"
            onClick={() => onSwitchView("login")}
            className="flex items-center justify-center w-full text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader className="space-y-2 pb-4">
        <DialogTitle className="text-xl">Forgot password?</DialogTitle>
        <DialogDescription>
          Enter your email and we&apos;ll send you a reset link.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <AlertBanner variant="error" message={error} />
        )}

        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              autoComplete="email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>

        <button
          type="button"
          onClick={() => onSwitchView("login")}
          className="flex items-center justify-center w-full text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sign in
        </button>
      </form>
    </>
  );
}

// ============================================================================
// Main Auth Modal Component
// ============================================================================

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultView = "login",
  onSuccess,
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>(defaultView);

  // Reset view when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setView(defaultView);
    }
    onOpenChange(newOpen);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6">
        {view === "login" && (
          <LoginView onSwitchView={setView} onSuccess={handleSuccess} />
        )}
        {view === "register" && (
          <RegisterView onSwitchView={setView} onSuccess={handleSuccess} />
        )}
        {view === "forgot-password" && (
          <ForgotPasswordView onSwitchView={setView} />
        )}
      </DialogContent>
    </Dialog>
  );
}
