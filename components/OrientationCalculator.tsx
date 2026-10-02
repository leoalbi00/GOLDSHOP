"use client";
import { useState } from "react";
import { toSnapshot } from "dinero.js";
import { PURITIES, estimatePayout, formatEur, offerPerGram } from "@/lib/pricing";
import { spreadFor } from "@/lib/margins";
import { useQuotes } from "@/lib/useQuotes";
import { useMargins } from "@/lib/useMargins";
import { cn } from "@/lib/cn";

const OPTIONS = ["18K", "24K"].map((id) => PURITIES.find((p) => p.id === id)!);
const MAX_GRAMS = 5000;

function parseGrams(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0.1 && n <= MAX_GRAMS ? Math.round(n * 10) / 10 : null;
}

/** Stima indicativa: grammi × quotazione netta del titolo (Borsa meno lo spread del negozio). Nessun bonus. */
export default function OrientationCalculator() {
  const { gold24k, silver, source } = useQuotes();
  const { settings } = useMargins();
  const [raw, setRaw] = useState("10");
  const [purityId, setPurityId] = useState("18K");

  const purity = OPTIONS.find((p) => p.id === purityId) ?? OPTIONS[0];
  const grams = parseGrams(raw);
  const invalid = raw.trim() !== "" && grams === null;
  const spread = spreadFor(settings, purity.id);
  const perGram = offerPerGram(purity, gold24k, silver, spread).toNumber();
  const cents = grams ? toSnapshot(estimatePayout(purity, grams, gold24k, silver, spread)).amount : 0;

  return (
    <div className="grid border border-[#b8925a]/50 bg-paper md:grid-cols-2">
      <div className="border-b border-[#b8925a]/30 p-6 sm:p-10 md:border-b-0 md:border-r">
        <label htmlFor="calc-grams" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Peso in grammi
        </label>
        <div
          className={cn(
            "mt-3 flex items-baseline gap-3 border-b-2 transition-colors focus-within:border-gold",
            invalid ? "border-rose-600" : "border-foreground",
          )}
        >
          <input
            id="calc-grams"
            inputMode="decimal"
            autoComplete="off"
            placeholder="10"
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, "").slice(0, 7))}
            aria-invalid={invalid}
            aria-describedby="calc-grams-help"
            className="w-full min-w-0 bg-transparent py-2 font-serif text-6xl font-medium leading-none tabular-nums outline-none placeholder:text-hairline sm:text-7xl"
          />
          <span className="pb-2 text-xl text-muted-foreground">g</span>
        </div>
        <p id="calc-grams-help" className={cn("mt-2 text-sm", invalid ? "text-rose-700" : "text-muted-foreground")}>
          {invalid ? `Inserisci un peso tra 0,1 e ${MAX_GRAMS.toLocaleString("it-IT")} grammi.` : "Puoi usare la virgola: es. 12,5"}
        </p>

        <div id="calc-purity" className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Caratura
        </div>
        <div role="radiogroup" aria-labelledby="calc-purity" className="mt-3 grid grid-cols-2 gap-2">
          {OPTIONS.map((p) => {
            const active = p.id === purityId;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPurityId(p.id)}
                className={cn(
                  "flex h-16 flex-col items-center justify-center border text-base font-semibold transition-colors",
                  active ? "border-foreground bg-foreground text-background" : "border-hairline hover:border-foreground",
                )}
              >
                {p.label}
                <span className="text-xs font-normal opacity-60">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-6 bg-gold-soft/60 p-6 sm:p-10">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Stima indicativa</div>
          <div className="mt-3 font-serif text-6xl font-medium leading-none tabular-nums sm:text-7xl" aria-live="polite">
            {grams ? formatEur(cents / 100) : "—"}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {grams ? `${grams.toLocaleString("it-IT")} g × ` : ""}
            {formatEur(perGram)}/g, quotazione netta {purity.label}.
          </p>
        </div>
        <p className="border-t border-[#b8925a]/30 pt-4 text-xs leading-relaxed text-muted-foreground">
          {source === "feed" ? "Quotazione aggiornata in tempo reale." : "Quotazione di riferimento, aggiornata periodicamente."} Il valore
          definitivo si stabilisce in negozio, dopo la pesata a vista e la verifica del titolo.
        </p>
      </div>
    </div>
  );
}
