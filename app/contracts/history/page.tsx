"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSearch,
  FileText,
  Loader2,
  Scale,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertBanner, EmptyState } from "@/components/common";
import { getMyContracts, type ContractListItem } from "@/lib/api/contracts";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "complete" | "in_progress";

// The contract drafting workflow moves through these phases. The
// status ↔ icon ↔ tone mapping deliberately mirrors /research/history
// so a user moving between the two surfaces sees consistent semantics.
const phaseConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle2 }
> = {
  intake: { label: "Intake", variant: "secondary", icon: Clock },
  requirements: { label: "Requirements", variant: "secondary", icon: Clock },
  drafting: { label: "Drafting", variant: "default", icon: Loader2 },
  review: { label: "Review", variant: "default", icon: Loader2 },
  approval: { label: "Approval", variant: "default", icon: Loader2 },
  complete: { label: "Complete", variant: "outline", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

const IN_PROGRESS_PHASES = new Set([
  "intake",
  "requirements",
  "drafting",
  "review",
  "approval",
]);

function ContractCard({ contract }: { contract: ContractListItem }) {
  const config = phaseConfig[contract.phase] || phaseConfig.intake;
  const StatusIcon = config.icon;
  const isActive = IN_PROGRESS_PHASES.has(contract.phase);
  const displayTitle =
    contract.title?.trim() || `Untitled ${contract.contract_type || "contract"}`;
  const partySummary = contract.parties.length
    ? contract.parties.slice(0, 2).join(" · ") +
      (contract.parties.length > 2 ? ` +${contract.parties.length - 2}` : "")
    : null;

  return (
    <Card className={cn("group", surfaceClasses.pagePanelInteractive)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
            <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/contracts?session=${contract.session_id}`}
              className="block truncate rounded text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open contract: ${displayTitle}`}
            >
              {displayTitle}
            </Link>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {contract.contract_type}
              {partySummary ? ` · ${partySummary}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={config.variant} className="h-5 px-2 text-xs">
                <StatusIcon
                  className={`mr-1 h-3 w-3 ${isActive ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {config.label}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatDistanceToNow(new Date(contract.updated_at || contract.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContractHistoryPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const tabRefs = useRef<Record<FilterKey, HTMLButtonElement | null>>({
    all: null,
    complete: null,
    in_progress: null,
  });

  useEffect(() => {
    // Initial isLoading state defaults to true via useState; no need
    // to re-set it here (avoids the cascading-render lint warning).
    let cancelled = false;
    getMyContracts({ limit: 100 })
      .then((items) => {
        if (cancelled) return;
        setContracts(items);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load contracts");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredContracts = contracts.filter((c) => {
    if (filter === "complete" && c.phase !== "complete") return false;
    if (filter === "in_progress" && !IN_PROGRESS_PHASES.has(c.phase)) return false;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const haystack =
        `${c.title || ""} ${c.contract_type} ${c.parties.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    }
    return true;
  });

  const tabKeys: FilterKey[] = ["all", "complete", "in_progress"];
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const idx = tabKeys.indexOf(filter);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabKeys.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabKeys.length) % tabKeys.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabKeys.length - 1;
    else return;
    e.preventDefault();
    const nextKey = tabKeys[next]!;
    setFilter(nextKey);
    tabRefs.current[nextKey]?.focus();
  };

  const counts = {
    all: contracts.length,
    complete: contracts.filter((c) => c.phase === "complete").length,
    in_progress: contracts.filter((c) => IN_PROGRESS_PHASES.has(c.phase)).length,
  };

  return (
    <div className="min-h-screen px-6 py-6 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Contract History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and resume your past contract drafting sessions
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/contracts")}>
            New Contract
          </Button>
        </div>

        {error ? (
          <AlertBanner variant="error" message={error} className="mb-6" />
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading contracts…
          </div>
        ) : contracts.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={FileText}
              title="No contracts yet"
              description="Draft your first contract and it will appear here for resume, review, or cloning."
              action={{
                label: "Start Drafting",
                onClick: () => router.push("/contracts"),
              }}
            />
          </div>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Filter contracts"
              className="mb-4 mt-6 flex flex-wrap items-center gap-2"
            >
              {(
                [
                  { key: "all" as const, label: "All", count: counts.all },
                  { key: "complete" as const, label: "Complete", count: counts.complete },
                  { key: "in_progress" as const, label: "In Progress", count: counts.in_progress },
                ]
              ).map((tab) => {
                const selected = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    ref={(el) => {
                      tabRefs.current[tab.key] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setFilter(tab.key)}
                    onKeyDown={handleTabKeyDown}
                    className={cn(
                      "ll-transition rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, contract type, or party"
                  className="pl-9"
                  aria-label="Search contracts"
                />
              </div>
            </div>

            {filteredContracts.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  icon={FileSearch}
                  title="No matches"
                  description={
                    filter === "complete"
                      ? "No completed contracts match your search."
                      : filter === "in_progress"
                        ? "No in-progress contracts match your search."
                        : "No contracts match your search."
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContracts.map((contract) => (
                  <ContractCard key={contract.session_id} contract={contract} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
