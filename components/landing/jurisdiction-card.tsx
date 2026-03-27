import { ArrowRight, Clock } from "lucide-react";

interface JurisdictionCardProps {
  country: string;
  flag: string;
  status: "live" | "coming-soon";
  description: string;
  stats?: { acts: number; judgments: number };
  href?: string;
}

export function JurisdictionCard({
  country,
  flag,
  status,
  description,
  stats,
  href,
}: JurisdictionCardProps) {
  const isLive = status === "live";

  const card = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-300 ${
        isLive
          ? "border-primary/30 bg-card shadow-soft hover:-translate-y-1 hover:shadow-floating cursor-pointer"
          : "border-border/30 bg-surface-container-low"
      }`}
    >
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl">{flag}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-status-success-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Clock className="h-3 w-3" />
            Soon
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold tracking-tight">{country}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Spacer to push bottom content down */}
      <div className="flex-1" />

      {/* Stats — inline row */}
      {isLive && stats && (
        <div className="mt-4 flex gap-5 border-t border-border/30 pt-4">
          <div>
            <p className="text-lg font-extrabold">{stats.acts.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acts</p>
          </div>
          <div>
            <p className="text-lg font-extrabold">{stats.judgments.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Judgments</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary transition-colors group-hover:text-brand-gold">
            Explore
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      )}
    </div>
  );

  if (isLive && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="h-full">
        {card}
      </a>
    );
  }

  return card;
}
