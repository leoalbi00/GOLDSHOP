"use client";
import { ChevronDown } from "lucide-react";
import siteData from "@/data/site-data.json";
import { reopensLabel, useStoreStatus } from "@/lib/useStoreStatus";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

const { hours, pricing } = siteData;

/** Stato del negozio in tempo reale nell'header, con orari completi nel popover. */
export default function LiveStoreBadge({ className }: { className?: string }) {
  const s = useStoreStatus();
  const open = s?.open ?? false;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "group inline-flex h-9 items-center gap-2.5 whitespace-nowrap rounded-full border px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30",
          !s ? "border-hairline text-transparent" : open ? "border-guarantee/30 bg-guarantee-soft text-guarantee" : "border-rose-800/20 bg-rose-50 text-rose-800",
          className,
        )}
        aria-label={!s ? "Stato del negozio" : open ? "Negozio aperto ora: vedi orari" : "Negozio chiuso ora: vedi orari"}
      >
        <span className="relative flex size-2">
          {open && <span className="absolute inset-0 animate-ping rounded-full bg-guarantee/60 motion-reduce:hidden" />}
          <span className={cn("relative size-2 rounded-full", !s ? "bg-hairline" : open ? "bg-guarantee" : "bg-rose-700")} />
        </span>
        <span>{!s ? "…" : open ? "Aperto ora" : "Chiuso ora"}</span>
        {s && (
          <span className="hidden normal-case tracking-normal 2xl:inline">
            <span className="opacity-40">—</span>{" "}
            {open ? "Via Maj 39/B · Bilancia omologata pronta" : `${reopensLabel(s)} · Blocca il prezzo online ${pricing.voucherValidityHours}h`}
          </span>
        )}
        <ChevronDown className="size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
      </PopoverTrigger>

      <PopoverContent>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Orari · ora di Bergamo</div>
        <dl className="mt-3 divide-y divide-border border-y border-border">
          {hours.map((h) => (
            <div key={h.days} className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">{h.days}</dt>
              <dd className="text-right tabular-nums">{h.hours}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {open
            ? `Aperto fino alle ${s?.closesAt}. Pesatura a vista su bilancia omologata.`
            : `${s ? reopensLabel(s) : "Chiuso"}. Intanto puoi bloccare il prezzo online per ${pricing.voucherValidityHours} ore.`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
          <a href="#calcolatore" className="border border-foreground px-3 py-2 text-center transition-colors hover:bg-foreground hover:text-background">
            Blocca il prezzo
          </a>
          <a href="#visita" className="border border-hairline px-3 py-2 text-center transition-colors hover:bg-muted">
            Indicazioni
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
