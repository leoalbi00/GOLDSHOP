import dayjs from "dayjs";

export type Timeframe = "7d" | "30d" | "1y";

export interface HistoryPoint {
  date: string; // ISO yyyy-mm-dd
  value: number; // €/g oro 24K
}

export interface HistoryPayload {
  timeframe: Timeframe;
  source: "demo" | "feed";
  points: HistoryPoint[];
}

export const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "7d", label: "7 giorni" },
  { id: "30d", label: "30 giorni" },
  { id: "1y", label: "1 anno" },
];

const SPEC: Record<Timeframe, { count: number; stepDays: number; volatility: number }> = {
  "7d": { count: 7, stepDays: 1, volatility: 0.004 },
  "30d": { count: 30, stepDays: 1, volatility: 0.005 },
  "1y": { count: 52, stepDays: 7, volatility: 0.012 },
};

/** PRNG deterministico (mulberry32): stessa serie a parità di seed. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Serie DIMOSTRATIVA che termina sul prezzo attuale: va sostituita con lo
 * storico reale di un feed di mercato (vedi app/api/history/route.ts).
 */
export function demoHistory(timeframe: Timeframe, endPrice: number, endDate: string): HistoryPoint[] {
  const { count, stepDays, volatility } = SPEC[timeframe];
  const rand = rng(count * 7919 + stepDays);
  const values = [endPrice];
  for (let i = 1; i < count; i++) {
    // Camminata all'indietro con leggera deriva rialzista verso il presente.
    const drift = 0.0015 * stepDays ** 0.5;
    values.unshift(values[0] * (1 - drift + (rand() - 0.5) * 2 * volatility));
  }
  const end = dayjs(endDate);
  return values.map((v, i) => ({
    date: end.subtract((count - 1 - i) * stepDays, "day").format("YYYY-MM-DD"),
    value: Math.round(v * 100) / 100,
  }));
}
