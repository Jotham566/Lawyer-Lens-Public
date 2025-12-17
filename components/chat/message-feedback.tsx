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
import { cn } from "@/lib/utils";

interface MessageFeedbackProps {
  messageId: string;
  onFeedback?: (feedback: FeedbackData) => void;
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
  className,
}: MessageFeedbackProps) {
  const [feedback, setFeedback] = React.useState<"positive" | "negative" | "flag" | null>(null);
  const [showThankYou, setShowThankYou] = React.useState(false);
  const [negativePopoverOpen, setNegativePopoverOpen] = React.useState(false);
  const [flagPopoverOpen, setFlagPopoverOpen] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = React.useState("");

  const handlePositiveFeedback = () => {
    setFeedback("positive");
    setShowThankYou(true);
    onFeedback?.({
      messageId,
      type: "positive",
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => setShowThankYou(false), 2000);
  };

  const handleNegativeFeedback = () => {
    if (!selectedReason) return;

    setFeedback("negative");
    setNegativePopoverOpen(false);
    setShowThankYou(true);
    onFeedback?.({
      messageId,
      type: "negative",
      reason: additionalDetails ? `${selectedReason}: ${additionalDetails}` : selectedReason,
      timestamp: new Date().toISOString(),
    });
    setSelectedReason(null);
    setAdditionalDetails("");
    setTimeout(() => setShowThankYou(false), 2000);
  };

  const handleFlagSubmit = () => {
    if (!selectedReason) return;

    setFeedback("flag");
    setFlagPopoverOpen(false);
    setShowThankYou(true);
    onFeedback?.({
      messageId,
      type: "flag",
      reason: additionalDetails ? `${selectedReason}: ${additionalDetails}` : selectedReason,
      timestamp: new Date().toISOString(),
    });
    setSelectedReason(null);
    setAdditionalDetails("");
    setTimeout(() => setShowThankYou(false), 2000);
  };

  // Show thank you message after feedback
  if (showThankYou) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400",
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
          <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        )}
        {feedback === "negative" && (
          <ThumbsDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        )}
        {feedback === "flag" && (
          <Flag className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
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
            className="h-7 w-7 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
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
                className="h-7 w-7 text-muted-foreground hover:text-slate-600 dark:hover:text-slate-400"
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
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors",
                    selectedReason === reason
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-muted border border-transparent"
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
              disabled={!selectedReason}
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
                className="h-7 w-7 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
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
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors",
                    selectedReason === reason
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      : "hover:bg-muted border border-transparent"
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
              variant="outline"
              className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50"
              disabled={!selectedReason}
              onClick={handleFlagSubmit}
            >
              Submit Flag
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
