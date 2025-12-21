"use client";

import { AlertCircle, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface RateLimitErrorProps {
    message: string;
}

/**
 * Enhanced error display for rate limit / usage exceeded errors
 * Shows a clear message with an upgrade CTA
 */
export function RateLimitError({ message }: RateLimitErrorProps) {
    // Check if it's a usage limit error with specific limit info
    const isUsageLimitError = message.includes("monthly limit") || message.includes("reached your");

    return (
        <div className="flex gap-4" role="alert" aria-live="assertive">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-3">
                <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <p className="font-medium mb-1">
                                {isUsageLimitError ? "Usage Limit Reached" : "Rate Limited"}
                            </p>
                            <p className="text-amber-600 dark:text-amber-500/90">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button asChild size="sm" className="gap-2">
                        <Link href="/billing/plans">
                            <Zap className="h-4 w-4" />
                            Upgrade Plan
                        </Link>
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Get more AI queries with a premium plan
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Check if an error message indicates a rate limit or usage exceeded condition
 */
export function isRateLimitError(error: string): boolean {
    const rateLimitPatterns = [
        "rate limit",
        "Rate limit",
        "monthly limit",
        "reached your",
        "usage limit",
        "Usage limit",
        "queries",
        "exceeded",
    ];

    return rateLimitPatterns.some(pattern => error.toLowerCase().includes(pattern.toLowerCase()));
}
