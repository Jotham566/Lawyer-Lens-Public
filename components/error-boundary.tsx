"use client"

import { type ReactNode } from "react"
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary"
import * as Sentry from "@sentry/nextjs"
import { AlertCircle, RefreshCw, Home, MessageSquare, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

/**
 * Generic error fallback component
 */
function GenericErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
  return (
    <div role="alert" className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMessage}
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={resetErrorBoundary} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Chat-specific error fallback
 */
export function ChatErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return (
    <div role="alert" className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Chat Error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We encountered an issue with the chat. Your conversation history is preserved.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 p-3 bg-muted rounded text-xs text-left overflow-auto max-w-full">
                {errorMessage}
              </pre>
            )}
            <div className="mt-6 flex gap-3">
              <Button onClick={resetErrorBoundary} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Reload Chat
              </Button>
              <Button asChild variant="outline">
                <Link href="/search">
                  Try Search Instead
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Search-specific error fallback
 */
export function SearchErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="flex items-center justify-center min-h-[300px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Search Failed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Unable to complete your search. Please check your connection and try again.
            </p>
            <Button onClick={resetErrorBoundary} className="mt-6">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Retry Search
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Document viewer error fallback
 */
export function DocumentErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Document Load Error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t load this document. It may have been removed or moved.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={resetErrorBoundary} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
              <Button asChild variant="outline">
                <Link href="/browse">
                  Browse Documents
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Billing-specific error fallback
 */
export function BillingErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return (
    <div role="alert" className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <CreditCard className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Billing Error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We encountered an issue loading your billing information. Your subscription and payment data are safe.
            </p>
            {process.env.NODE_ENV === "development" && errorMessage && (
              <pre className="mt-4 p-3 bg-muted rounded text-xs text-left overflow-auto max-w-full">
                {errorMessage}
              </pre>
            )}
            <div className="mt-6 flex gap-3">
              <Button onClick={resetErrorBoundary} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/help">
                  Contact Support
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              If this issue persists, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Page-level error boundary wrapper
 */
interface PageErrorBoundaryProps {
  children: ReactNode
  fallback?: "generic" | "chat" | "search" | "document" | "billing"
  onReset?: () => void
}

export function PageErrorBoundary({
  children,
  fallback = "generic",
  onReset,
}: PageErrorBoundaryProps) {
  const FallbackComponent = {
    generic: GenericErrorFallback,
    chat: ChatErrorFallback,
    search: SearchErrorFallback,
    document: DocumentErrorFallback,
    billing: BillingErrorFallback,
  }[fallback]

  const handleError = (error: unknown, info: { componentStack?: string | null }) => {
    // Log error to console in development
    console.error("Error caught by boundary:", error)
    console.error("Component stack:", info.componentStack)

    // Report to Sentry in production
    const errorToReport = error instanceof Error ? error : new Error(String(error))
    Sentry.captureException(errorToReport, {
      extra: {
        componentStack: info.componentStack,
        fallbackType: fallback,
      },
      tags: {
        errorBoundary: fallback,
      },
    })
  }

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={onReset}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children as any}
    </ReactErrorBoundary>
  )
}

/**
 * Inline error boundary for smaller sections
 */
export function InlineErrorBoundary({
  children,
  fallbackMessage = "This section failed to load",
}: {
  children: ReactNode
  fallbackMessage?: string
}) {
  return (
    <ReactErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-sm"
        >
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />
          <span className="text-destructive">{fallbackMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetErrorBoundary}
            className="ml-auto h-7 px-2"
          >
            Retry
          </Button>
        </div>
      )}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children as any}
    </ReactErrorBoundary>
  )
}

export { GenericErrorFallback }
