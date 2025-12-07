"use client";

import { Search, FileText, Wrench, X, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    color: "text-blue-500",
  },
  {
    id: "draft-contract",
    name: "Draft Contract",
    description: "Generate contracts with templates and compliance review",
    icon: FileText,
    color: "text-green-500",
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
}: ToolsDropdownProps) {
  const activeTool = tools.find((t) => t.id === selectedTool);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-2 px-3 rounded-full border",
                selectedTool !== "chat"
                  ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
                  : "hover:bg-muted"
              )}
              disabled={disabled}
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
              {selectedTool !== "chat" && activeTool && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 px-1.5 text-xs font-normal",
                    activeTool.color
                  )}
                >
                  {activeTool.name.split(" ")[0]}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {selectedTool === "chat" ? "Select a tool" : `Active: ${activeTool?.name}`}
        </TooltipContent>
      </Tooltip>
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
                "flex items-start gap-3 p-3 cursor-pointer",
                isSelected && "bg-accent"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}
              >
                <Icon className={cn("h-5 w-5", tool.color)} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tool.name}</span>
                  {tool.badge && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
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
      <button
        onClick={onClear}
        className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
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
