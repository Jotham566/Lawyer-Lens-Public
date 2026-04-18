import { Badge } from "./badge";

/**
 * "Pro" tier badge. Used next to nav entries for premium-gated features
 * (Deep Research, Contract Drafting) when the current user lacks the
 * entitlement. Shared between the desktop sidebar and the mobile drawer
 * so the locked-tier visual reads as a single coherent "tier" signal
 * across surfaces — and so a future tier rename / colour change is a
 * single-file edit.
 *
 * Defensive ``shrink-0`` is intentional: nav rows are flex containers
 * and the badge must not get squeezed when label text is long.
 */
export function ProBadge() {
  return (
    <Badge
      variant="outline"
      className="h-5 shrink-0 rounded-full border-brand-gold/50 bg-brand-gold/10 px-2 text-[10px] font-semibold uppercase tracking-wider text-brand-gold"
    >
      Pro
    </Badge>
  );
}
