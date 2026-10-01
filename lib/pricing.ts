import BigNumber from "bignumber.js";
import { dinero, toDecimal, EUR, type Dinero } from "dinero.js";
import siteData from "@/data/site-data.json";

export type Metal = "gold" | "silver";

export interface Purity {
  id: string;
  label: string;
  metal: Metal;
  fineness: number; // millesimi / 1000
  desc: string;
}

export const PURITIES: Purity[] = [
  { id: "24K", label: "Oro 24K", metal: "gold", fineness: 0.999, desc: "Lingotti / Monete (999)" },
  { id: "18K", label: "Oro 18K", metal: "gold", fineness: 0.75, desc: "Gioielli usati (750)" },
  { id: "14K", label: "Oro 14K", metal: "gold", fineness: 0.585, desc: "Oro 585" },
  { id: "9K", label: "Oro 9K", metal: "gold", fineness: 0.375, desc: "Oro 375" },
  { id: "AG", label: "Argento", metal: "silver", fineness: 0.999, desc: "Argento 999" },
];

export interface Quote {
  id: string;
  label: string;
  eurPerGram: number;
}

export interface QuotesPayload {
  updatedAt: string;
  source: "reference" | "feed";
  base: { gold24k: number; silver: number };
  quotes: Quote[];
}

/** Prezzo di borsa €/g per la caratura, prima del margine del negozio. */
export function spotPerGram(p: Purity, gold24k: number, silver: number): BigNumber {
  const base = p.metal === "gold" ? gold24k : silver;
  return new BigNumber(base).times(p.fineness);
}

export function buildQuotes(gold24k: number, silver: number): Quote[] {
  return PURITIES.map((p) => ({
    id: p.id,
    label: p.label,
    eurPerGram: spotPerGram(p, gold24k, silver).decimalPlaces(2).toNumber(),
  }));
}

/** Stima netta riconosciuta al cliente, come importo Dinero in centesimi di euro. */
export function estimatePayout(
  p: Purity,
  grams: number,
  gold24k: number,
  silver: number,
  payoutRatio: number = siteData.pricing.payoutRatio,
): Dinero<number> {
  const cents = spotPerGram(p, gold24k, silver)
    .times(grams)
    .times(payoutRatio)
    .times(100)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();
  return dinero({ amount: cents, currency: EUR });
}

const eurFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEur(value: Dinero<number> | number): string {
  const n = typeof value === "number" ? value : Number(toDecimal(value));
  return eurFormatter.format(n);
}
