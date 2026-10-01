"use client";
import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Award, Scale, Lock, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";
import siteData from "@/data/site-data.json";
import { PURITIES, estimatePayout, formatEur, spotPerGram, type Purity } from "@/lib/pricing";
import { useQuotes } from "@/lib/useQuotes";
import VoucherModal, { type VoucherData } from "@/components/VoucherModal";

const MIN_GRAMS = 1;
const MAX_GRAMS = 500;

export default function GoldCalculator() {
  const { gold24k, silver } = useQuotes();
  const [grams, setGrams] = useState(15);
  const [purity, setPurity] = useState<Purity>(PURITIES[1]);
  const [voucher, setVoucher] = useState<VoucherData | null>(null);

  const payout = useMemo(
    () => estimatePayout(purity, grams, gold24k, silver),
    [purity, grams, gold24k, silver],
  );
  const spot = spotPerGram(purity, gold24k, silver).toNumber();

  function lockPrice() {
    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#f59e0b", "#fcd34d", "#fef3c7", "#10b981"],
    });
    setVoucher({ purity, grams, amount: formatEur(payout), issuedAt: new Date() });
  }

  return (
    <section id="calcolatore" className="scroll-mt-20">
      <div className="bg-zinc-950 border border-amber-500/25 rounded-3xl p-6 md:p-10 shadow-2xl shadow-amber-500/5">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-zinc-800 pb-6 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Stima immediata online</span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">Calcola il valore del tuo oro</h2>
          </div>
          <div className="bg-black px-4 py-2 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-500 block">Quotazione {purity.label}</span>
            <span className="text-lg font-mono font-bold text-amber-300">{formatEur(spot)}/g</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <fieldset>
              <legend className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Caratura
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PURITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={purity.id === p.id}
                    onClick={() => setPurity(p)}
                    className={clsx(
                      "p-3.5 rounded-xl border text-left transition-all",
                      purity.id === p.id
                        ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10"
                        : "bg-black border-zinc-800 hover:border-zinc-600",
                    )}
                  >
                    <div className="font-bold text-lg text-white">{p.id}</div>
                    <div className="text-xs text-zinc-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label htmlFor="grams" className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" /> Peso
                </label>
                <span className="text-2xl font-mono font-bold text-amber-300">{grams} g</span>
              </div>
              <input
                id="grams"
                type="range"
                min={MIN_GRAMS}
                max={MAX_GRAMS}
                step={1}
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-zinc-600 font-mono mt-1">
                <span>{MIN_GRAMS} g</span>
                <span>{MAX_GRAMS} g</span>
              </div>
            </div>
          </div>

          <div className="bg-black rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Stima netta</span>
              <div
                aria-live="polite"
                className="text-4xl md:text-5xl font-black font-mono text-emerald-400 tracking-tight my-2 tabular-nums"
              >
                {formatEur(payout)}
              </div>
              <p className="text-xs text-zinc-500">
                Stima indicativa: il valore definitivo è determinato in negozio con pesatura e verifica della caratura.
              </p>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-3">
                <Clock className="w-4 h-4 text-amber-400" />
                Blocca il prezzo per {siteData.pricing.voucherValidityHours} ore.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={lockPrice}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
              >
                <Lock className="w-5 h-5" />
                BLOCCA IL PREZZO 24H
              </button>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 pt-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Registro OAM
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pagamento immediato
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VoucherModal voucher={voucher} onClose={() => setVoucher(null)} />
    </section>
  );
}
