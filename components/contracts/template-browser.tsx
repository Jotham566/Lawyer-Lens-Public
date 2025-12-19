"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  User,
  Briefcase,
  Home,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getEnhancedTemplates, type EnhancedTemplate } from "@/lib/api/contracts";

interface TemplateBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: EnhancedTemplate) => void;
  selectedId?: string;
}

const contractTypeIcons: Record<string, React.ReactNode> = {
  employment: <User className="h-4 w-4" />,
  nda: <Shield className="h-4 w-4" />,
  service: <Briefcase className="h-4 w-4" />,
  sale: <FileText className="h-4 w-4" />,
  lease: <Home className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />,
};

const sourceLabels: Record<string, string> = {
  system: "System",
  user: "My Templates",
  from_contract: "From Contract",
  uploaded: "Uploaded",
};

export function TemplateBrowser({
  open,
  onClose,
  onSelect,
  selectedId,
}: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<EnhancedTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EnhancedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEnhancedTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterTemplates = useCallback(() => {
    let filtered = templates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description?.toLowerCase().includes(query) ?? false)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.contract_type === typeFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((t) => t.source === sourceFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, sourceFilter, typeFilter]);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, typeFilter, sourceFilter, filterTemplates]);

  const handleSelect = (template: EnhancedTemplate) => {
    onSelect(template);
    onClose();
  };

  const getContractTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Browse Templates
          </DialogTitle>
          <DialogDescription>
            Select a template to use as the starting point for your contract
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Contract Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="employment">Employment</SelectItem>
              <SelectItem value="nda">NDA</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="lease">Lease</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">My Templates</SelectItem>
              <SelectItem value="from_contract">From Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No templates found
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                    selectedId === template.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  )}
                  onClick={() => handleSelect(template)}
                >
                  <div className="p-2 rounded-lg bg-muted">
                    {contractTypeIcons[template.contract_type] || (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{template.name}</span>
                      {selectedId === template.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {getContractTypeLabel(template.contract_type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {sourceLabels[template.source] || template.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {template.sections_count} sections
                      </span>
                      {template.times_used > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Used {template.times_used} times
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
