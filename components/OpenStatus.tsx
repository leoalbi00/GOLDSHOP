"use client";
import { reopensLabel, useStoreStatus } from "@/lib/useStoreStatus";
import { cn } from "@/lib/cn";

export default function OpenStatus({ className }: { className?: string }) {
  const s = useStoreStatus();
  const label = !s ? "Orari di apertura" : s.open ? `Aperto ora · chiude alle ${s.closesAt}` : `Chiuso · ${reopensLabel(s).toLowerCase()}`;

  return (
    <div className={cn("inline-flex items-center gap-2 text-sm", className)} aria-live="polite">
      <span className={cn("size-2 rounded-full", !s ? "bg-hairline" : s.open ? "bg-guarantee" : "bg-muted-foreground")} />
      <span className={cn("font-medium", s?.open ? "text-guarantee" : "text-foreground")}>{label}</span>
    </div>
  );
}
