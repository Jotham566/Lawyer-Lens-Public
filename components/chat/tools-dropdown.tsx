"use client";

import { useState } from "react";
import { ChevronDown, Search, FileText, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const experimentalBadgeClass =
  "h-5 rounded-full border border-primary/15 bg-primary/10 px-2 text-[10px] font-medium text-secondary-foreground";

export type ToolMode = "chat" | "deep-research" | "draft-contract";

interface Tool {
  id: ToolMode;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color: string;
}

const tools: Tool[] = [
  {
    id: "deep-research",
    name: "Deep Research",
    description: "Comprehensive multi-step legal research with citations",
    icon: Search,
    badge: "Experimental",
    color: "text-primary",
  },
  {
    id: "draft-contract",
    name: "Draft Contract",
    description: "Generate contracts with templates and compliance review",
    icon: FileText,
    badge: "Experimental",
    color: "text-secondary-foreground",
  },
];

interface ToolsDropdownProps {
  selectedTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  disabled?: boolean;
}

export function ToolsDropdown({
  selectedTool,
  onSelectTool,
  disabled = false,
  className,
  showLabel = true,
}: ToolsDropdownProps & { className?: string; showLabel?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const activeTool = tools.find((t) => t.id === selectedTool);
  const ActiveToolIcon = activeTool?.icon;
  const handleClearTool = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectTool("chat");
  };

  return (
    <DropdownMenu>
      <div
        className="relative inline-flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 gap-2 rounded-full border px-3",
                  selectedTool !== "chat"
                    ? cn(surfaceClasses.buttonSelected, "font-medium")
                    : "ll-button-ghost text-muted-foreground",
                  className
                )}
                disabled={disabled}
              >
                {selectedTool !== "chat" && activeTool ? (
                  <>
                    {ActiveToolIcon ? (
                      <ActiveToolIcon className={cn("h-4 w-4", activeTool.color, "opacity-100")} />
                    ) : null}
                    {showLabel && (
                      <span className="flex items-center gap-2 text-foreground">
                        <span>{activeTool.name}</span>
                        {activeTool.badge ? (
                          <Badge variant="secondary" className={experimentalBadgeClass}>
                            {activeTool.badge}
                          </Badge>
                        ) : null}
                      </span>
                    )}
                    {showLabel && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-4 w-4" />
                    {showLabel && <span className="hidden sm:inline">Tools</span>}
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {selectedTool === "chat" ? "Select a tool" : `Active: ${activeTool?.name}`}
          </TooltipContent>
        </Tooltip>
        {selectedTool !== "chat" && isHovered && (
          <button
            type="button"
            aria-label={`Clear ${activeTool?.name ?? "tool"}`}
            className={cn(
              "absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2",
              surfaceClasses.floatingIconButton
            )}
            onClick={handleClearTool}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClearTool(e);
              }
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Tools
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <DropdownMenuItem
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={cn(
                "group flex items-start gap-3 p-3 cursor-pointer",
                isSelected ? surfaceClasses.rowInteractiveActive : surfaceClasses.rowInteractive
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-glass",
                  isSelected
                    ? "bg-[color:var(--interactive-hover-surface-strong)]"
                    : "bg-surface-container-high"
                )}
              >
                <Icon className={cn("h-5 w-5", tool.color)} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tool.name}</span>
                  {tool.badge && (
                    <Badge variant="secondary" className={cn("h-5 px-2 text-[10px]", experimentalBadgeClass)}>
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {tool.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ActiveToolIndicatorProps {
  tool: ToolMode;
  onClear: () => void;
}

export function ActiveToolIndicator({ tool, onClear }: ActiveToolIndicatorProps) {
  if (tool === "chat") return null;

  const activeTool = tools.find((t) => t.id === tool);
  if (!activeTool) return null;

  const Icon = activeTool.icon;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
      <Icon className={cn("h-4 w-4", activeTool.color)} />
      <span className="text-sm font-medium">{activeTool.name}</span>
      {activeTool.badge ? (
        <Badge variant="secondary" className={experimentalBadgeClass}>
          {activeTool.badge}
        </Badge>
      ) : null}
      <button
        type="button"
        onClick={onClear}
        className={cn("ml-1 p-0.5 rounded-full", surfaceClasses.iconButton)}
        aria-label="Clear tool selection"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function getToolPlaceholder(tool: ToolMode): string {
  switch (tool) {
    case "deep-research":
      return "Describe your legal research topic...";
    case "draft-contract":
      return "Describe the contract you need (e.g., 'Employment contract for a software developer')...";
    default:
      return "Ask a legal question...";
  }
}

export function getToolEmptyStateTitle(tool: ToolMode): string {
  switch (tool) {
    case "deep-research":
      return "Deep Legal Research";
    case "draft-contract":
      return "Contract Drafting";
    default:
      return "Legal Research Assistant";
  }
}

export function getToolEmptyStateDescription(tool: ToolMode): string {
  switch (tool) {
    case "deep-research":
      return "Get comprehensive research reports with citations from Uganda's legal framework. Perfect for complex legal questions requiring thorough analysis.";
    case "draft-contract":
      return "Generate professional contracts based on Ugandan law. Choose from templates for employment, NDA, service agreements, and more.";
    default:
      return "Ask questions about Uganda's laws, regulations, and legal procedures. Get answers with citations to authoritative sources.";
  }
}

export function getToolSuggestedQuestions(tool: ToolMode): string[] {
  switch (tool) {
    case "deep-research":
      return [
        "What are the tax implications for foreign investors in Uganda?",
        "Compare employment termination procedures under Uganda law",
        "Analyze land ownership requirements for non-citizens in Uganda",
        "Research data protection compliance requirements for businesses",
      ];
    case "draft-contract":
      return [
        "Employment contract for a marketing manager",
        "Non-disclosure agreement between two companies",
        "Service agreement for IT consulting services",
        "Commercial lease agreement for office space",
      ];
    default:
      return [
        "What are the penalties for tax evasion in Uganda?",
        "How do I register a company in Uganda?",
        "What are the requirements for land ownership?",
        "Explain the process for filing a civil suit",
      ];
  }
}
