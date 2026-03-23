"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown, Flag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface MessageFeedbackProps {
  messageId: string;
  onFeedback?: (feedback: FeedbackData) => Promise<void> | void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export interface FeedbackData {
  messageId: string;
  type: "positive" | "negative" | "flag";
  reason?: string;
  timestamp: string;
}

const NEGATIVE_REASONS = [
  "Incorrect information",
  "Missing citations",
  "Outdated information",
  "Not relevant to question",
  "Too vague or general",
];

const FLAG_REASONS = [
  "Potentially harmful advice",
  "Factually incorrect",
  "Missing important context",
  "Misinterpreted the law",
];

/**
 * MessageFeedback - Allows users to provide feedback on AI responses
 *
 * Provides thumbs up/down and flag options with optional detailed feedback.
 * This helps improve response quality and identifies potential issues.
 */
export function MessageFeedback({
  messageId,
  onFeedback,
  disabled = false,
  disabledReason,
  className,
}: MessageFeedbackProps) {
  const [feedback, setFeedback] = React.useState<"positive" | "negative" | "flag" | null>(null);
  const [showThankYou, setShowThankYou] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [negativePopoverOpen, setNegativePopoverOpen] = React.useState(false);
  const [flagPopoverOpen, setFlagPopoverOpen] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = React.useState("");

  const submitFeedback = async (payload: FeedbackData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onFeedback?.(payload);
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit feedback");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePositiveFeedback = async () => {
    const ok = await submitFeedback({
      messageId,
      type: "positive",
      timestamp: new Date().toISOString(),
    });
    if (!ok) return;

    setFeedback("positive");
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 2000);
  };

  const handleNegativeFeedback = async () => {
    if (!selectedReason) return;

    const ok = await submitFeedback({
      messageId,
      type: "negative",
      reason: additionalDetails ? `${selectedReason}: ${additionalDetails}` : selectedReason,
      timestamp: new Date().toISOString(),
    });
    if (!ok) return;

    setFeedback("negative");
    setNegativePopoverOpen(false);
    setShowThankYou(true);
    setSelectedReason(null);
    setAdditionalDetails("");
    setTimeout(() => setShowThankYou(false), 2000);
  };

  const handleFlagSubmit = async () => {
    if (!selectedReason) return;

    const ok = await submitFeedback({
      messageId,
      type: "flag",
      reason: additionalDetails ? `${selectedReason}: ${additionalDetails}` : selectedReason,
      timestamp: new Date().toISOString(),
    });
    if (!ok) return;

    setFeedback("flag");
    setFlagPopoverOpen(false);
    setShowThankYou(true);
    setSelectedReason(null);
    setAdditionalDetails("");
    setTimeout(() => setShowThankYou(false), 2000);
  };

  // Show thank you message after feedback
  if (showThankYou) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-secondary-foreground",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Check className="h-3.5 w-3.5" />
        <span>Thanks for your feedback</span>
      </div>
    );
  }

  // Already gave feedback - show muted state
  if (feedback) {
    return (
      <div
        className={cn("flex items-center gap-1", className)}
        aria-label="Feedback submitted"
      >
        {feedback === "positive" && (
          <ThumbsUp className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden="true" />
        )}
        {feedback === "negative" && (
          <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        )}
        {feedback === "flag" && (
          <Flag className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="group"
      aria-label="Rate this response"
    >
      {/* Thumbs Up */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", surfaceClasses.iconButton)}
            disabled={disabled || isSubmitting}
            onClick={handlePositiveFeedback}
            aria-label="This response was helpful"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Helpful</TooltipContent>
      </Tooltip>

      {/* Thumbs Down with reason selection */}
      <Popover open={negativePopoverOpen} onOpenChange={setNegativePopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", surfaceClasses.iconButton)}
                disabled={disabled || isSubmitting}
                aria-label="This response needs improvement"
                aria-expanded={negativePopoverOpen}
                aria-haspopup="dialog"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Needs improvement</TooltipContent>
        </Tooltip>
        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-72 max-w-72 p-3"
          align="start"
          side="top"
          role="dialog"
          aria-label="Provide feedback on this response"
        >
          <div className="space-y-3">
            <p className="text-sm font-medium">What could be improved?</p>
            <div className="space-y-1.5" role="radiogroup" aria-label="Reason for feedback">
              {NEGATIVE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full rounded-md px-2.5 py-1.5 text-left text-xs",
                    selectedReason === reason
                      ? surfaceClasses.optionCardActive
                      : surfaceClasses.optionCard
                  )}
                  role="radio"
                  aria-checked={selectedReason === reason}
                >
                  {reason}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Additional details (optional)"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="text-xs min-h-[60px]"
              aria-label="Additional feedback details"
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!selectedReason || isSubmitting}
              onClick={handleNegativeFeedback}
            >
              Submit Feedback
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Flag for review */}
      <Popover open={flagPopoverOpen} onOpenChange={setFlagPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", surfaceClasses.iconButton)}
                disabled={disabled || isSubmitting}
                aria-label="Flag this response for review"
                aria-expanded={flagPopoverOpen}
                aria-haspopup="dialog"
              >
                <Flag className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Flag for review</TooltipContent>
        </Tooltip>
        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-72 max-w-72 p-3"
          align="start"
          side="top"
          role="dialog"
          aria-label="Flag response for review"
        >
          <div className="space-y-3">
            <p className="text-sm font-medium">Why are you flagging this?</p>
            <div className="space-y-1.5" role="radiogroup" aria-label="Reason for flagging">
              {FLAG_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full rounded-md px-2.5 py-1.5 text-left text-xs",
                    selectedReason === reason
                      ? surfaceClasses.optionCardActive
                      : surfaceClasses.optionCard
                  )}
                  role="radio"
                  aria-checked={selectedReason === reason}
                >
                  {reason}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Please describe the issue..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="text-xs min-h-[60px]"
              aria-label="Describe the issue"
            />
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={!selectedReason || isSubmitting}
              onClick={handleFlagSubmit}
            >
              Submit Flag
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {submitError && <span className="text-xs text-destructive">{submitError}</span>}
      {!submitError && disabled && disabledReason && (
        <span className="text-xs text-muted-foreground">{disabledReason}</span>
      )}
    </div>
  );
}
