"use client";

import { useState } from "react";
import {
  Sparkles,
  FileText,
  Copy,
  Upload,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SourceType = "fresh" | "template" | "clone" | "upload";

export interface SourceSelectionProps {
  onSelect: (source: SourceType, id?: string) => void;
  onOpenTemplateBrowser: () => void;
  onOpenContractBrowser: () => void;
  selectedSource: SourceType | null;
  selectedTemplateId?: string;
  selectedContractId?: string;
  templateName?: string;
  contractName?: string;
}

interface SourceOption {
  id: SourceType;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  action?: string;
}

const sourceOptions: SourceOption[] = [
  {
    id: "fresh",
    title: "Start Fresh",
    description: "Let AI generate a new contract based on your description",
    icon: <Sparkles className="h-6 w-6" />,
    badge: "Recommended",
  },
  {
    id: "template",
    title: "Use Template",
    description: "Start from an existing template with pre-defined structure",
    icon: <FileText className="h-6 w-6" />,
    action: "Browse Templates",
  },
  {
    id: "clone",
    title: "Clone Past Contract",
    description: "Use a previously created contract as the starting point",
    icon: <Copy className="h-6 w-6" />,
    action: "Browse Contracts",
  },
  {
    id: "upload",
    title: "Upload Template",
    description: "Upload your own template file (DOCX or PDF)",
    icon: <Upload className="h-6 w-6" />,
    badge: "Coming Soon",
  },
];

export function SourceSelection({
  onSelect,
  onOpenTemplateBrowser,
  onOpenContractBrowser,
  selectedSource,
  selectedTemplateId,
  selectedContractId,
  templateName,
  contractName,
}: SourceSelectionProps) {
  const [hoveredOption, setHoveredOption] = useState<SourceType | null>(null);

  const handleOptionClick = (option: SourceOption) => {
    if (option.id === "upload") {
      // Coming soon
      return;
    }

    if (option.id === "template") {
      onOpenTemplateBrowser();
    } else if (option.id === "clone") {
      onOpenContractBrowser();
    } else {
      onSelect(option.id);
    }
  };

  const isSelected = (id: SourceType) => {
    if (id === selectedSource) return true;
    if (id === "template" && selectedTemplateId) return true;
    if (id === "clone" && selectedContractId) return true;
    return false;
  };

  const getSelectionLabel = (id: SourceType) => {
    if (id === "template" && selectedTemplateId && templateName) {
      return templateName;
    }
    if (id === "clone" && selectedContractId && contractName) {
      return contractName;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-1">How would you like to start?</h3>
        <p className="text-sm text-muted-foreground">
          Choose how to begin your contract drafting
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sourceOptions.map((option) => {
          const selected = isSelected(option.id);
          const selectionLabel = getSelectionLabel(option.id);
          const disabled = option.id === "upload";

          return (
            <Card
              key={option.id}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                selected && "ring-2 ring-primary border-primary",
                hoveredOption === option.id && !disabled && "border-primary/50 shadow-md",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onMouseEnter={() => !disabled && setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => !disabled && handleOptionClick(option)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      selected ? "bg-primary/10 text-primary" : "bg-muted"
                    )}
                  >
                    {option.icon}
                  </div>
                  {option.badge && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        option.badge === "Recommended"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {option.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base mt-3">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {selectionLabel ? (
                  <div className="flex items-center justify-between bg-primary/5 rounded-md px-3 py-2 text-sm">
                    <span className="text-primary font-medium truncate">{selectionLabel}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionClick(option);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : option.action && !disabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionClick(option);
                    }}
                  >
                    {option.action}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : selected ? (
                  <div className="flex items-center text-sm text-primary">
                    <span className="font-medium">Selected</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
