"use client";
import { useMemo, useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { toSnapshot } from "dinero.js";
import axios from "axios";
import { toast } from "sonner";
import { Info, Loader2, Lock, Minus, Plus } from "lucide-react";
import siteData from "@/data/site-data.json";
import { PURITIES, estimatePayout, formatEur, offerPerGram, spotPerGram } from "@/lib/pricing";
import { spreadFor } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { useQuotes } from "@/lib/useQuotes";
import { useMargins } from "@/lib/useMargins";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VoucherLockModal from "@/components/VoucherLockModal";
import PurityBreakdown from "@/components/PurityBreakdown";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/cn";

const TAB_IDS = ["24K", "18K", "14K", "AG", "AG925"];
const TABS = TAB_IDS.map((id) => PURITIES.find((p) => p.id === id)!);
const TAB_LABEL: Record<string, { name: string; title: string }> = {
  "24K": { name: "24K", title: "999" },
  "18K": { name: "18K", title: "750" },
  "14K": { name: "14K", title: "585" },
  AG: { name: "Argento", title: "999" },
  AG925: { name: "Argento", title: "925" },
};
const MAX_GRAMS = 5000;

const gramsFmt = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Accetta "15,5" o "15.5" con al massimo un decimale; null se non valido. */
function parseGrams(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0.1 && n <= MAX_GRAMS ? Math.round(n * 10) / 10 : null;
}

/** Ripulisce l'input: solo cifre, un separatore, un solo decimale. */
function sanitize(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const [int, ...rest] = cleaned.split(",");
  return rest.length ? `${int},${rest.join("").replace(/,/g, "").slice(0, 1)}` : int;
}

function toRaw(n: number): string {
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

export default function BespokeCalculator() {
  const { gold24k, silver } = useQuotes();
  const { settings } = useMargins();
  const [purityId, setPurityId] = useState("18K");
  const [rawGrams, setRawGrams] = useState("15,0");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [locking, setLocking] = useState(false);

  const purity = TABS.find((p) => p.id === purityId) ?? TABS[0];
  const grams = parseGrams(rawGrams);
  const invalid = rawGrams.trim() !== "" && grams === null;
  const spread = spreadFor(settings, purity.id);
  const spot = spotPerGram(purity, gold24k, silver);
  const offer = offerPerGram(purity, gold24k, silver, spread);
  const payout = useMemo(
    () => (grams ? estimatePayout(purity, grams, gold24k, silver, spread) : null),
    [purity, grams, gold24k, silver, spread],
  );
  const payoutCents = payout ? toSnapshot(payout).amount : 0;

  const step = (delta: number) => {
    const next = Math.min(MAX_GRAMS, Math.max(0.1, (grams ?? 0) + delta));
    setRawGrams(toRaw(next));
  };

  const lock = async () => {
    if (!payout || !grams || locking) return;
    setLocking(true);
    try {
      // Il server ricalcola l'importo con quotazione e spread correnti e registra il voucher.
      const { data } = await axios.post<Voucher>("/api/vouchers", { purityId: purity.id, grams });
      setVoucher(data);
    } catch (err) {
      const msg = axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined;
      toast.error(msg ?? "Non è stato possibile bloccare la quotazione. Riprova o chiamaci.");
      return;
    } finally {
      setLocking(false);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <section
        id="calcolatore"
        aria-labelledby="calc-title"
        className="scroll-mt-28 rounded-sm border border-hairline bg-paper shadow-[0_1px_0_rgba(17,24,39,0.04),0_24px_48px_-32px_rgba(17,24,39,0.25)]"
      >
        <header className="flex items-baseline justify-between gap-4 border-b border-border px-6 py-5 md:px-8">
          <h2 id="calc-title" className="font-serif text-2xl font-medium tracking-tight">
            Stima del tuo metallo
          </h2>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Aggiornata ogni minuto
          </span>
        </header>

        <div className="space-y-8 px-6 py-7 md:px-8">
          <div>
            <div id="purity-label" className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Metallo e titolo
            </div>
            <TabsPrimitive.Root value={purityId} onValueChange={setPurityId} className="mt-3">
              <TabsPrimitive.List aria-labelledby="purity-label" className="grid grid-cols-5 border border-hairline">
                {TABS.map((p) => (
                  <TabsPrimitive.Trigger
                    key={p.id}
                    value={p.id}
                    className="flex flex-col items-center gap-0.5 border-l border-hairline px-1 py-3 text-foreground transition-colors first:border-l-0 hover:bg-muted focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 data-[state=active]:bg-foreground data-[state=active]:text-background"
                  >
                    {p.metal === "silver" ? (
                      <span className="text-sm font-semibold">
                        <span className="sm:hidden">Ag</span>
                        <span className="hidden sm:inline">{TAB_LABEL[p.id].name}</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold">{TAB_LABEL[p.id].name}</span>
                    )}
                    <span className="text-[10px] tabular-nums tracking-wider opacity-60">{TAB_LABEL[p.id].title}</span>
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>
            </TabsPrimitive.Root>
          </div>

          <div>
            <label
              htmlFor="grams"
              className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
            >
              Peso in grammi
            </label>
            <div
              className={cn(
                "mt-3 flex items-stretch border-b-2 transition-colors focus-within:border-gold",
                invalid ? "border-rose-600" : "border-foreground",
              )}
            >
              <input
                id="grams"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,0"
                value={rawGrams}
                onChange={(e) => setRawGrams(sanitize(e.target.value))}
                onBlur={() => grams && setRawGrams(toRaw(grams))}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                  e.preventDefault();
                  step((e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 1 : 0.1));
                }}
                aria-invalid={invalid}
                aria-describedby="grams-help"
                className="min-w-0 flex-1 bg-transparent py-2 text-5xl font-medium tracking-tight tabular-nums text-foreground outline-none placeholder:text-hairline"
              />
              <span className="self-end pb-3 pl-2 font-serif text-2xl italic text-muted-foreground">g</span>
              <div className="ml-4 flex items-center gap-1 self-center">
                <button
                  type="button"
                  aria-label="Diminuisci di 0,1 g"
                  onClick={() => step(-0.1)}
                  className="flex size-9 items-center justify-center border border-hairline text-foreground transition-colors hover:bg-muted active:translate-y-px"
                >
                  <Minus className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Aumenta di 0,1 g"
                  onClick={() => step(0.1)}
                  className="flex size-9 items-center justify-center border border-hairline text-foreground transition-colors hover:bg-muted active:translate-y-px"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <p id="grams-help" className={cn("mt-2 text-xs", invalid ? "text-rose-700" : "text-muted-foreground")}>
              {invalid
                ? `Inserisci un peso tra 0,1 e ${MAX_GRAMS.toLocaleString("it-IT")} g.`
                : "Precisione al decimo di grammo · frecce ↑ ↓ per ±0,1 g (Maiusc ±1 g)"}
            </p>
          </div>

          <dl className="divide-y divide-border border-y border-border text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Quotazione {purity.label}</dt>
              <dd className="tabular-nums">{formatEur(spot.toNumber())}/g</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">La nostra offerta</dt>
              <dd className="font-medium tabular-nums text-foreground">{formatEur(offer.toNumber())}/g</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Peso</dt>
              <dd className="tabular-nums">{grams ? `${gramsFmt.format(grams)} g` : "—"}</dd>
            </div>
          </dl>

          <PurityBreakdown purity={purity} grams={grams} />

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Valore stimato netto
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Come calcoliamo la stima" className="text-muted-foreground hover:text-foreground">
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Quotazione del titolo meno {formatEur(spread)}/g di margine del negozio, moltiplicata per il peso.
                  Il valore finale è confermato in negozio dopo pesatura su bilancia omologata e verifica del titolo.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-3 text-5xl font-medium leading-none tracking-[-0.03em] tabular-nums text-foreground md:text-6xl">
              <NumberTicker
                aria-hidden
                value={payoutCents / 100}
                decimalPlaces={2}
                locale="it-IT"
                formatOptions={{ style: "currency", currency: "EUR" }}
                className="tracking-[-0.03em] text-foreground"
              />
              <span className="sr-only" aria-live="polite">
                {payout ? formatEur(payout) : "Nessuna stima"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={lock}
            disabled={!payout || locking}
            aria-busy={locking}
            className="group flex h-14 w-full items-center justify-center gap-3 rounded-sm bg-gold text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_4px_0_0_#5b2808,0_10px_20px_-10px_rgba(146,64,14,0.6)] transition-[transform,box-shadow,background-color] duration-100 ease-out hover:bg-[#7c360c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-[4px] active:shadow-[0_0_0_0_#5b2808,0_2px_6px_-4px_rgba(146,64,14,0.6)] disabled:pointer-events-none disabled:opacity-40"
          >
            {locking ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            Blocca quotazione {siteData.pricing.voucherValidityHours}h
          </button>
        </div>

        <VoucherLockModal voucher={voucher} onClose={() => setVoucher(null)} />
      </section>
    </TooltipProvider>
  );
}
