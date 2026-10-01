import { Flame, TriangleAlert } from "lucide-react";
import type { VoucherState } from "@/lib/vouchers";
import type { VolatilityAlert } from "@/lib/volatility-alert";
import { cn } from "@/lib/cn";

const pill = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap";

const STATE: Record<VoucherState, { label: string; cls: string }> = {
  active: { label: "Attivo", cls: "border-guarantee/30 bg-guarantee-soft text-guarantee" },
  completed: { label: "Completato", cls: "border-foreground/20 bg-foreground text-background" },
  expired: { label: "Scaduto", cls: "border-hairline bg-muted text-muted-foreground" },
};

export function StateBadge({ state }: { state: VoucherState }) {
  return <span className={cn(pill, STATE[state].cls)}>{STATE[state].label}</span>;
}

export function HotLeadBadge() {
  return (
    <span className={cn(pill, "border-gold/30 bg-gold-soft text-gold")}>
      <Flame className="size-3" /> Cliente top · hot lead
    </span>
  );
}

const pctFmt = new Intl.NumberFormat("it-IT", { signDisplay: "always", maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function VolatilityBadge({ v }: { v: VolatilityAlert }) {
  if (!v.alert) return null;
  return (
    <span
      className={cn(pill, v.marginAtRisk ? "border-rose-700/30 bg-rose-50 text-rose-800" : "border-amber-700/30 bg-amber-50 text-amber-800")}
      title="Variazione della quotazione rispetto al momento del blocco"
    >
      <TriangleAlert className="size-3" /> {v.marginAtRisk ? "Rischio margine" : "Mercato in rialzo"} {pctFmt.format(v.changePct)}%
    </span>
  );
}
