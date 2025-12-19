"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Copy,
  Loader2,
  CheckCircle2,
  Calendar,
  Users,
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
import { getMyContracts, type ContractListItem } from "@/lib/api/contracts";

interface ContractBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contract: ContractListItem) => void;
  selectedId?: string;
}

const phaseColors: Record<string, string> = {
  review: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approval: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  complete: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function ContractBrowser({
  open,
  onClose,
  onSelect,
  selectedId,
}: ContractBrowserProps) {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyContracts();
      setContracts(data);
    } catch (error) {
      console.error("Failed to load contracts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterContracts = useCallback(() => {
    let filtered = contracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.title?.toLowerCase().includes(query) ?? false) ||
          c.contract_type.toLowerCase().includes(query) ||
          c.parties.some((p) => p.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.contract_type === typeFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchQuery, typeFilter]);

  useEffect(() => {
    if (open) {
      loadContracts();
    }
  }, [open, loadContracts]);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, typeFilter, filterContracts]);

  const handleSelect = (contract: ContractListItem) => {
    onSelect(contract);
    onClose();
  };

  const getContractTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Browse Past Contracts
          </DialogTitle>
          <DialogDescription>
            Select a contract to use as a starting point. Party details and settings will be pre-filled.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
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
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No contracts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete some contracts first to use them as templates
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.session_id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                    selectedId === contract.session_id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  )}
                  onClick={() => handleSelect(contract)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {contract.title || `${getContractTypeLabel(contract.contract_type)} Contract`}
                      </span>
                      {selectedId === contract.session_id && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(contract.created_at)}
                      </div>
                      {contract.parties.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {contract.parties.slice(0, 2).join(", ")}
                          {contract.parties.length > 2 && ` +${contract.parties.length - 2}`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {getContractTypeLabel(contract.contract_type)}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs",
                          phaseColors[contract.phase] || "bg-muted"
                        )}
                      >
                        {contract.phase.charAt(0).toUpperCase() + contract.phase.slice(1)}
                      </Badge>
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
