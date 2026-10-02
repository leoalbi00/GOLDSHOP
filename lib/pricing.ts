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
  { id: "AG925", label: "Argento 925", metal: "silver", fineness: 0.925, desc: "Argento sterling (925)" },
];

export interface Quote {
  id: string;
  label: string;
  eurPerGram: number;
  /** Variazione % rispetto alla chiusura precedente. */
  changePct: number;
}

export interface QuotesPayload {
  updatedAt: string;
  source: "reference" | "feed";
  base: { gold24k: number; silver: number };
  /** Chiusura precedente, base della variazione %. */
  prev: { gold24k: number; silver: number };
  quotes: Quote[];
  /** Massimo storico dell'oro 24K (€/g): il più alto tra il record in site-data e quello visto dal feed. */
  allTimeHigh: { gold24k: number; date: string };
}

/** Prezzo di borsa €/g per la caratura, prima del margine del negozio. */
export function spotPerGram(p: Purity, gold24k: number, silver: number): BigNumber {
  const base = p.metal === "gold" ? gold24k : silver;
  return new BigNumber(base).times(p.fineness);
}

export function buildQuotes(
  gold24k: number,
  silver: number,
  prev: { gold24k: number; silver: number },
): Quote[] {
  return PURITIES.map((p) => {
    const now = p.metal === "gold" ? gold24k : silver;
    const before = p.metal === "gold" ? prev.gold24k : prev.silver;
    return {
      id: p.id,
      label: p.label,
      eurPerGram: spotPerGram(p, gold24k, silver).decimalPlaces(2).toNumber(),
      changePct: before ? new BigNumber(now).minus(before).div(before).times(100).decimalPlaces(2).toNumber() : 0,
    };
  });
}

/** Quotazioni di riferimento lette da data/site-data.json. */
export function referenceQuotes(): QuotesPayload {
  const p = siteData.pricing;
  const prev = { gold24k: p.gold24kPrevClose, silver: p.silver999PrevClose };
  return {
    updatedAt: p.updatedAt,
    source: "reference",
    base: { gold24k: p.gold24kEurPerGram, silver: p.silver999EurPerGram },
    prev,
    quotes: buildQuotes(p.gold24kEurPerGram, p.silver999EurPerGram, prev),
    allTimeHigh: { gold24k: p.allTimeHigh.gold24kEurPerGram, date: p.allTimeHigh.date },
  };
}

/** Valore €/g riconosciuto al cliente: quotazione del titolo meno lo spread del negozio, mai negativo. */
export function offerPerGram(p: Purity, gold24k: number, silver: number, spreadPerGram: number): BigNumber {
  return BigNumber.max(spotPerGram(p, gold24k, silver).minus(spreadPerGram), 0);
}

/** Stima netta riconosciuta al cliente, come importo Dinero in centesimi di euro. */
export function estimatePayout(
  p: Purity,
  grams: number,
  gold24k: number,
  silver: number,
  spreadPerGram: number,
): Dinero<number> {
  const cents = offerPerGram(p, gold24k, silver, spreadPerGram)
    .times(grams)
    .times(100)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();
  return dinero({ amount: cents, currency: EUR });
}

export function purityById(id: string): Purity | undefined {
  return PURITIES.find((p) => p.id === id);
}

const eurFormatter = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEur(value: Dinero<number> | number): string {
  const n = typeof value === "number" ? value : Number(toDecimal(value));
  return eurFormatter.format(n);
}
