"use client";
import { useMemo, useState } from "react";
import axios from "axios";
import { toSnapshot } from "dinero.js";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Crown, Flame, Loader2, ShieldCheck, Ticket } from "lucide-react";
import siteData from "@/data/site-data.json";
import { PURITIES, estimatePayout, formatEur, offerPerGram } from "@/lib/pricing";
import { DEFAULT_MARGINS, effectiveSpread, vipTier, type VipLevel } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { lockRequestToShopLink } from "@/lib/whatsapp-engine";
import { useQuotes } from "@/lib/useQuotes";
import { useMargins } from "@/lib/useMargins";
import { NumberTicker } from "@/components/ui/number-ticker";
import VoucherModal from "@/components/VoucherModal";
import VIPBookingModal from "@/components/VIPBookingModal";
import { cn } from "@/lib/cn";

const OPTIONS = [
  { id: "18K", label: "Oro 18K", sub: "750" },
  { id: "24K", label: "Oro 24K", sub: "999" },
  { id: "AG", label: "Argento", sub: "999" },
].map((o) => ({ ...o, purity: PURITIES.find((p) => p.id === o.id)! }));

const PRESETS = [5, 10, 20, 50, 100];
const MAX_GRAMS = 5000;
const { compliance } = siteData;

function parseGrams(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0.1 && n <= MAX_GRAMS ? Math.round(n * 10) / 10 : null;
}

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

const TIER_STYLE: Record<VipLevel, { box: string; icon: typeof Crown }> = {
  standard: { box: "border-hairline bg-paper text-foreground", icon: ShieldCheck },
  bonus: { box: "border-[#c2410c] bg-[#fff4ec] text-[#7c2d12]", icon: Flame },
  vip: { box: "border-[#b8925a] bg-foreground text-[#f5e6b8]", icon: Crown },
};

function Euro({ cents, className }: { cents: number; className?: string }) {
  return (
    <NumberTicker
      aria-hidden
      value={cents / 100}
      decimalPlaces={2}
      locale="it-IT"
      formatOptions={{ style: "currency", currency: "EUR" }}
      className={cn("tracking-tight", className)}
    />
  );
}

/** Tre gradini: Standard → Bonus → VIP. Il gradino raggiunto si accende in oro. */
function TierMeter({ level, bonusMin, vipMin }: { level: VipLevel; bonusMin: number; vipMin: number }) {
  const steps: { id: VipLevel; label: string }[] = [
    { id: "standard", label: "Standard" },
    { id: "bonus", label: `Bonus · da ${bonusMin} g` },
    { id: "vip", label: `VIP · oltre ${vipMin} g` },
  ];
  const reached = steps.findIndex((s) => s.id === level);
  return (
    <ol className="grid grid-cols-3 gap-1.5" aria-label="Livelli bonus">
      {steps.map((s, i) => (
        <li key={s.id}>
          <div className={cn("h-1.5 rounded-full transition-colors duration-500", i <= reached ? "bg-gradient-to-r from-[#b8925a] to-[#e2c58f]" : "bg-hairline")} />
          <div className={cn("mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]", i <= reached ? "text-gold" : "text-muted-foreground")}>
            {s.label}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Calcolatore gamificato: Borsa vs netto in cassa, livelli bonus e voucher VIP con prezzo bloccato. */
export default function AttractiveCalculator() {
  const reduce = useReducedMotion();
  const { gold24k, silver } = useQuotes();
  const { settings } = useMargins();
  const [raw, setRaw] = useState("10");
  const [purityId, setPurityId] = useState("18K");
  const [sending, setSending] = useState(false);
  const [voucher, setVoucher] = useState<Voucher | null>(null);

  const { purity } = OPTIONS.find((o) => o.id === purityId) ?? OPTIONS[0];
  const grams = parseGrams(raw);
  const invalid = raw.trim() !== "" && grams === null;
  const g = grams ?? 0;
  const spread = effectiveSpread(settings, purity, g);
  const tier = vipTier(settings, purity, g);
  const vip = { ...DEFAULT_MARGINS.promotions.vip, ...settings.promotions?.vip };

  const { spotCents, netCents, bonusCents } = useMemo(() => {
    if (!grams) return { spotCents: 0, netCents: 0, bonusCents: 0 };
    const cents = (s: number) => toSnapshot(estimatePayout(purity, grams, gold24k, silver, s)).amount;
    const net = cents(spread);
    return { spotCents: cents(0), netCents: net, bonusCents: Math.max(0, net - cents(spread + tier.bonusPerGram)) };
  }, [purity, grams, gold24k, silver, spread, tier.bonusPerGram]);

  const cash = netCents < compliance.cashLimitEur * 100;
  const missing = tier.next ? Math.max(0.1, Math.round((tier.next.minGrams - g + (tier.next.level === "vip" ? 0.1 : 0)) * 10) / 10) : 0;

  const lock = async () => {
    if (!grams || sending) return;
    setSending(true);
    try {
      // Il server ricalcola l'importo (spread e bonus VIP inclusi) e registra il voucher per la dashboard.
      const { data } = await axios.post<Voucher>("/api/vouchers", { purityId: purity.id, grams });
      setVoucher(data);
    } catch {
      const link = lockRequestToShopLink({ purityLabel: purity.label, grams, amountCents: netCents, vipBonusPerGram: tier.bonusPerGram });
      toast.error("Non siamo riusciti a registrare il voucher.", {
        action: { label: "Scrivi su WhatsApp", onClick: () => window.open(link, "_blank", "noopener") },
      });
    } finally {
      setSending(false);
    }
  };

  const { box, icon: TierIcon } = TIER_STYLE[tier.level];

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-paper shadow-[0_40px_80px_-48px_rgba(17,24,39,0.45)]">
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        {/* Input */}
        <div className="border-b border-border p-6 sm:p-10 lg:border-b-0 lg:border-r">
          <label htmlFor="vip-grams" className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Quanti grammi porti?
          </label>
          <div
            className={cn(
              "mt-3 flex items-baseline gap-3 border-b-4 transition-colors focus-within:border-gold",
              invalid ? "border-rose-600" : "border-foreground",
            )}
          >
            <input
              id="vip-grams"
              inputMode="decimal"
              autoComplete="off"
              placeholder="12"
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, "").slice(0, 7))}
              aria-invalid={invalid}
              aria-describedby="vip-grams-help"
              className="w-full min-w-0 bg-transparent py-2 text-[clamp(4rem,12vw,7rem)] font-semibold leading-none tracking-tight tabular-nums outline-none placeholder:text-hairline"
            />
            <span className="pb-3 text-2xl font-medium text-muted-foreground">g</span>
          </div>
          <p id="vip-grams-help" className={cn("mt-2 text-sm", invalid ? "text-rose-700" : "text-muted-foreground")}>
            {invalid ? `Scrivi un peso tra 0,1 e ${MAX_GRAMS.toLocaleString("it-IT")} grammi.` : "Puoi usare la virgola: es. 12,5"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Pesi rapidi">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRaw(String(p))}
                aria-pressed={grams === p}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors",
                  grams === p ? "border-foreground bg-foreground text-background" : "border-hairline hover:border-foreground",
                )}
              >
                {p} g
              </button>
            ))}
          </div>

          <div className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground" id="vip-purity">
            Che cosa porti?
          </div>
          <div role="radiogroup" aria-labelledby="vip-purity" className="mt-3 grid grid-cols-3 gap-2">
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
                    "flex h-20 flex-col items-center justify-center rounded-xl border-2 text-base font-bold transition-colors sm:text-lg",
                    active ? "border-foreground bg-foreground text-background" : "border-hairline hover:border-foreground",
                  )}
                >
                  {o.label}
                  <span className="text-xs font-medium opacity-60">({o.sub})</span>
                </button>
              );
            })}
          </div>

          {purity.metal === "gold" && vip.active && (
            <div className="mt-8">
              <TierMeter level={tier.level} bonusMin={vip.bonusMinGrams} vipMin={vip.vipMinGrams} />
            </div>
          )}
        </div>

        {/* Risultato */}
        <div className="flex flex-col gap-6 bg-[radial-gradient(ellipse_at_top_right,#f6efe4,transparent_70%)] p-6 sm:p-10">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline">
            <div className="bg-paper p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quotazione grezza Borsa</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground sm:text-3xl">
                <Euro cents={spotCents} className="text-muted-foreground" />
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">
                {formatEur(offerPerGram(purity, gold24k, silver, 0).toNumber())}/g · prima delle spese di affinazione
              </dd>
            </div>
            <div className="bg-guarantee-soft p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-guarantee">Netto in cassa</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-guarantee sm:text-3xl">
                <Euro cents={netCents} className="text-guarantee" />
              </dd>
              <dd className="mt-1 text-xs text-guarantee/80">
                {formatEur(offerPerGram(purity, gold24k, silver, spread).toNumber())}/g ·{" "}
                {cash ? "in contanti" : `con bonifico o assegno (da ${compliance.cashLimitEur} € per legge)`}
              </dd>
            </div>
          </dl>
          <span className="sr-only" aria-live="polite">
            {grams ? `Netto in cassa ${formatEur(netCents / 100)}, quotazione di Borsa ${formatEur(spotCents / 100)}` : "Inserisci il peso"}
          </span>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tier.level}
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn("rounded-xl border-2 p-5", box)}
              role="status"
            >
              <div className="flex items-start gap-3">
                <TierIcon className="mt-0.5 size-6 shrink-0" strokeWidth={1.75} />
                <div className="min-w-0">
                  {tier.level === "standard" && <div className="text-lg font-bold">Valutazione Standard Garantita</div>}
                  {tier.level === "bonus" && (
                    <div className="text-lg font-bold">
                      🔥 Bonus sbloccato: +{formatEur(tier.bonusPerGram)}/g extra — riscatta oggi in sede
                    </div>
                  )}
                  {tier.level === "vip" && (
                    <div className="text-lg font-bold">
                      👑 Trattamento VIP sbloccato: +{formatEur(tier.bonusPerGram)}/g extra + Perizia nel Salotto Riservato
                    </div>
                  )}
                  {bonusCents > 0 && (
                    <div className="mt-1 text-sm opacity-80">
                      Già incluso nel netto: <strong className="tabular-nums">+{formatEur(bonusCents / 100)}</strong> sul tuo lotto.
                    </div>
                  )}
                  {tier.next && grams !== null && (
                    <div className="mt-1 text-sm opacity-80">
                      Aggiungi {gramsFmt.format(missing)} g d&apos;oro per sbloccare{" "}
                      {tier.next.level === "vip" ? "il Trattamento VIP" : "il Bonus"} (+{formatEur(tier.next.bonusPerGram)}/g).
                    </div>
                  )}
                  {purity.metal === "silver" && vip.active && (
                    <div className="mt-1 text-sm opacity-80">I bonus VIP si applicano ai lotti d&apos;oro.</div>
                  )}
                  {tier.level === "vip" && (
                    <VIPBookingModal>
                      <button type="button" className="mt-2 text-sm font-semibold underline underline-offset-4">
                        Prenota la perizia riservata →
                      </button>
                    </VIPBookingModal>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto">
            <motion.button
              type="button"
              onClick={lock}
              disabled={!grams || sending}
              whileHover={reduce ? undefined : { scale: 1.015 }}
              whileTap={reduce ? undefined : { scale: 0.985 }}
              className="relative flex min-h-20 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-b from-[#e9d6ad] via-[#d4af37] to-[#b8925a] px-6 text-lg font-extrabold text-foreground shadow-[0_6px_0_0_#92400e,0_24px_40px_-16px_rgba(146,64,14,0.6)] transition-shadow active:translate-y-[6px] active:shadow-none disabled:opacity-40 sm:text-xl"
            >
              {!reduce && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] animate-[shine_3.2s_ease-in-out_infinite] bg-white/40"
                />
              )}
              {sending ? <Loader2 className="size-6 animate-spin" /> : <Ticket className="size-6" />}
              Blocca Prezzo & Sblocca Voucher VIP
            </motion.button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Prezzo bloccato {siteData.pricing.voucherValidityHours} ore · Il valore finale si conferma in negozio dopo la pesata a vista.
            </p>
          </div>
        </div>
      </div>
      <VoucherModal voucher={voucher} onClose={() => setVoucher(null)} />
    </div>
  );
}
