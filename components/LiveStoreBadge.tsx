"use client";
import { ChevronDown } from "lucide-react";
import siteData from "@/data/site-data.json";
import { reopensLabel, useStoreStatus } from "@/lib/useStoreStatus";
import { StatusBadge } from "@/components/ui/status-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const { address, hours, contacts } = siteData;

/** Stato del negozio in tempo reale nell'header, con orari completi nel popover. */
export default function LiveStoreBadge({ className }: { className?: string }) {
  const s = useStoreStatus();
  const open = s?.open ?? false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 ${className ?? ""}`}
          aria-label={!s ? "Stato del negozio" : open ? "Negozio aperto ora: vedi orari" : "Negozio chiuso ora: vedi orari"}
        >
          <StatusBadge status={!s ? "loading" : open ? "online" : "offline"} className="h-9 text-[11px] font-semibold uppercase tracking-[0.14em]">
            {!s ? "…" : open ? "Aperto ora" : "Chiuso ora"}
            {s && (
              <span className="hidden normal-case tracking-normal 2xl:inline">
                <span className="opacity-40">—</span>{" "}
                {open ? `${address.street}, ${address.city}` : reopensLabel(s)}
              </span>
            )}
            <ChevronDown className="size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
          </StatusBadge>
        </button>
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
            : `${s ? reopensLabel(s) : "Chiuso"}. Puoi chiamarci o scriverci su WhatsApp.`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
          <a href={`tel:${contacts.phoneIntl}`} className="border border-foreground px-3 py-2 text-center transition-colors hover:bg-foreground hover:text-background">
            Chiama
          </a>
          <a href="#contatti" className="border border-hairline px-3 py-2 text-center transition-colors hover:bg-muted">
            Indicazioni
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
