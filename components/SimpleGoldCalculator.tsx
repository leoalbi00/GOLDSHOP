"use client";
import { useMemo, useState } from "react";
import axios from "axios";
import { toSnapshot } from "dinero.js";
import { Loader2, MessageCircle } from "lucide-react";
import siteData from "@/data/site-data.json";
import { PURITIES, estimatePayout, formatEur, offerPerGram } from "@/lib/pricing";
import { spreadFor } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { lockRequestToShopLink } from "@/lib/whatsapp-engine";
import { useQuotes } from "@/lib/useQuotes";
import { useMargins } from "@/lib/useMargins";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/cn";

const OPTIONS = [
  { id: "18K", label: "Oro 18K", sub: "750" },
  { id: "24K", label: "Oro 24K", sub: "999" },
  { id: "AG", label: "Argento", sub: "999" },
].map((o) => ({ ...o, purity: PURITIES.find((p) => p.id === o.id)! }));

const MAX_GRAMS = 5000;

function parseGrams(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0.1 && n <= MAX_GRAMS ? Math.round(n * 10) / 10 : null;
}

/** Calcolatore essenziale: grammi, caratura, stima, e la richiesta di blocco prezzo diretta su WhatsApp. */
export default function SimpleGoldCalculator() {
  const { gold24k, silver } = useQuotes();
  const { settings } = useMargins();
  const [raw, setRaw] = useState("10");
  const [purityId, setPurityId] = useState("18K");
  const [sending, setSending] = useState(false);

  const { purity } = OPTIONS.find((o) => o.id === purityId) ?? OPTIONS[0];
  const grams = parseGrams(raw);
  const invalid = raw.trim() !== "" && grams === null;
  const spread = spreadFor(settings, purity.id);
  const cents = useMemo(
    () => (grams ? toSnapshot(estimatePayout(purity, grams, gold24k, silver, spread)).amount : 0),
    [purity, grams, gold24k, silver, spread],
  );

  const lockOnWhatsApp = async () => {
    if (!grams || sending) return;
    setSending(true);
    // Finestra aperta subito, nel gesto dell'utente: dopo un await i browser bloccano i popup.
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    let link: string;
    try {
      // Il voucher registrato compare nella dashboard del negozio (hot lead, conclusione, scheda OAM).
      const { data } = await axios.post<Voucher>("/api/vouchers", { purityId: purity.id, grams });
      link = lockRequestToShopLink(data);
    } catch {
      link = lockRequestToShopLink({ purityLabel: purity.label, grams, amountCents: cents });
    } finally {
      setSending(false);
    }
    if (win) win.location.href = link;
    else window.location.href = link;
  };

  return (
    <div className="border border-hairline bg-paper shadow-[0_32px_64px_-40px_rgba(17,24,39,0.35)]">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-border p-6 sm:p-10 lg:border-b-0 lg:border-r">
          <label htmlFor="simple-grams" className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Quanti grammi?
          </label>
          <div
            className={cn(
              "mt-3 flex items-baseline gap-3 border-b-4 transition-colors focus-within:border-gold",
              invalid ? "border-rose-600" : "border-foreground",
            )}
          >
            <input
              id="simple-grams"
              inputMode="decimal"
              autoComplete="off"
              placeholder="12"
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, "").slice(0, 7))}
              aria-invalid={invalid}
              aria-describedby="simple-grams-help"
              className="w-full min-w-0 bg-transparent py-2 text-[clamp(4rem,12vw,7rem)] font-semibold leading-none tracking-tight tabular-nums outline-none placeholder:text-hairline"
            />
            <span className="pb-3 text-2xl font-medium text-muted-foreground">grammi</span>
          </div>
          <p id="simple-grams-help" className={cn("mt-2 text-sm", invalid ? "text-rose-700" : "text-muted-foreground")}>
            {invalid ? `Scrivi un peso tra 0,1 e ${MAX_GRAMS.toLocaleString("it-IT")} grammi.` : "Puoi usare la virgola: es. 12,5"}
          </p>

          <div className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground" id="simple-purity">
            Che cosa porti?
          </div>
          <div role="radiogroup" aria-labelledby="simple-purity" className="mt-3 grid grid-cols-3 gap-2">
            {OPTIONS.map((o) => {
              const active = o.id === purityId;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPurityId(o.id)}
                  className={cn(
                    "flex h-20 flex-col items-center justify-center border-2 text-base font-bold transition-colors sm:text-lg",
                    active ? "border-foreground bg-foreground text-background" : "border-hairline hover:border-foreground",
                  )}
                >
                  {o.label}
                  <span className="text-xs font-medium opacity-60">({o.sub})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 bg-guarantee-soft/50 p-6 sm:p-10">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-guarantee">Stima netta</div>
            <div className="mt-2 text-[clamp(3.25rem,8vw,5.5rem)] font-bold leading-none tracking-tight tabular-nums text-guarantee">
              <NumberTicker
                aria-hidden
                value={cents / 100}
                decimalPlaces={2}
                locale="it-IT"
                formatOptions={{ style: "currency", currency: "EUR" }}
                className="tracking-tight text-guarantee"
              />
              <span className="sr-only" aria-live="polite">
                {grams ? `Stima netta ${formatEur(cents / 100)}` : "Inserisci il peso"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {formatEur(offerPerGram(purity, gold24k, silver, spread).toNumber())} al grammo per l’{purity.label}.
              Il valore finale si conferma in negozio, dopo la pesata a vista.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={lockOnWhatsApp}
              disabled={!grams || sending}
              className="flex min-h-20 w-full items-center justify-center gap-3 bg-[#1f9d55] px-6 text-lg font-bold text-white shadow-[0_5px_0_0_#13703b] transition-[transform,box-shadow,background-color] hover:bg-[#1b8a4b] active:translate-y-[5px] active:shadow-none disabled:opacity-40 sm:text-xl"
            >
              {sending ? <Loader2 className="size-6 animate-spin" /> : <MessageCircle className="size-6" />}
              Blocca Prezzo su WhatsApp
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Si apre WhatsApp con il messaggio pronto per il negozio ({siteData.contacts.phone}). Prezzo bloccato{" "}
              {siteData.pricing.voucherValidityHours} ore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
