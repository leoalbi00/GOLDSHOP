"use client";
import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Award, Scale, Lock, Clock } from "lucide-react";
import siteData from "@/data/site-data.json";
import { PURITIES, estimatePayout, formatEur, spotPerGram, type Purity } from "@/lib/pricing";
import { useQuotes } from "@/lib/useQuotes";
import { cn } from "@/lib/cn";
import VoucherLockModal, { type VoucherData } from "@/components/VoucherLockModal";

const MIN_GRAMS = 1;
const MAX_GRAMS = 500;

export default function GoldCalculator({ className }: { className?: string }) {
  const { gold24k, silver } = useQuotes();
  const [grams, setGrams] = useState(15);
  const [purity, setPurity] = useState<Purity>(PURITIES[1]);
  const [voucher, setVoucher] = useState<VoucherData | null>(null);

  const payout = useMemo(
    () => estimatePayout(purity, grams, gold24k, silver),
    [purity, grams, gold24k, silver],
  );
  const spot = spotPerGram(purity, gold24k, silver).toNumber();
  const fillPct = ((grams - MIN_GRAMS) / (MAX_GRAMS - MIN_GRAMS)) * 100;

  function lockPrice() {
    const burst = (originX: number) =>
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.65 },
        colors: ["#f59e0b", "#fcd34d", "#fef3c7", "#10b981"],
      });
    burst(0.3);
    burst(0.7);
    setVoucher({ purity, grams, amount: formatEur(payout), issuedAt: new Date() });
  }

  return (
    <div
      id="calcolatore"
      className={cn(
        "scroll-mt-24 rounded-3xl border border-amber-500/25 bg-zinc-950/90 backdrop-blur p-6 md:p-8 shadow-2xl shadow-amber-500/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-amber-400 font-bold">Stima istantanea</span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-white mt-1">Quanto vale il tuo oro?</h2>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-zinc-500 block">{purity.label}</span>
          <span className="font-mono font-bold text-amber-300">{formatEur(spot)}/g</span>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Caratura
        </legend>
        <div className="grid grid-cols-5 gap-2">
          {PURITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={purity.id === p.id}
              title={p.desc}
              onClick={() => setPurity(p)}
              className={cn(
                "rounded-xl border py-2.5 font-bold transition-all",
                purity.id === p.id
                  ? "bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10"
                  : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600",
              )}
            >
              {p.id}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">{purity.desc}</p>
      </fieldset>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <label htmlFor="grams" className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" /> Peso
          </label>
          <span className="text-2xl font-mono font-bold text-amber-300 tabular-nums">{grams} g</span>
        </div>
        <input
          id="grams"
          type="range"
          min={MIN_GRAMS}
          max={MAX_GRAMS}
          step={1}
          value={grams}
          onChange={(e) => setGrams(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
          style={{ background: `linear-gradient(90deg, #f59e0b ${fillPct}%, #27272a ${fillPct}%)` }}
        />
        <div className="flex justify-between text-[11px] text-zinc-600 font-mono mt-1">
          <span>{MIN_GRAMS} g</span>
          <span>{MAX_GRAMS} g</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Stima netta</span>
        <div
          aria-live="polite"
          className="text-4xl md:text-5xl font-black font-mono text-emerald-400 tracking-tight mt-1 tabular-nums"
        >
          {formatEur(payout)}
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">
          Indicativa: il valore finale è confermato in negozio con pesatura e verifica della caratura.
        </p>
      </div>

      <button
        type="button"
        onClick={lockPrice}
        className="mt-5 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.99] text-black font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all"
      >
        <Lock className="w-5 h-5" />
        BLOCCA PREZZO 24H
      </button>
      <p className="mt-3 text-xs text-zinc-500 flex items-center justify-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        Ricevi un voucher con QR valido {siteData.pricing.voucherValidityHours} ore
      </p>

      <VoucherLockModal voucher={voucher} onClose={() => setVoucher(null)} />
    </div>
  );
}
