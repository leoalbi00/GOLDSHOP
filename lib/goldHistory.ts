import type { UTCTimestamp } from "lightweight-charts";

export type Timeframe = "24H" | "7D" | "30D" | "1Y";

export const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "24H", label: "24H" },
  { id: "7D", label: "7G" },
  { id: "30D", label: "30G" },
  { id: "1Y", label: "1A" },
];

export interface PricePoint {
  time: UTCTimestamp;
  value: number;
}

const HOUR = 3600;
const DAY = 24 * HOUR;

/** Passo e numero di punti per ogni timeframe. */
const SPEC: Record<Timeframe, { step: number; points: number }> = {
  "24H": { step: 5 * 60, points: 288 },
  "7D": { step: HOUR, points: 168 },
  "30D": { step: 4 * HOUR, points: 180 },
  "1Y": { step: DAY, points: 365 },
};

/** Variazione annua usata per ancorare l'inizio della serie 1A. */
const YEAR_DRIFT = 0.18;
/** Volatilità giornaliera indicativa dell'oro. */
const DAILY_VOL = 0.0055;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Percorso casuale vincolato a partire da `from` e finire esattamente su `to`. */
function bridge(from: number, to: number, n: number, stepDays: number, seed: string): number[] {
  const rand = mulberry32(hashSeed(seed));
  const gauss = () => {
    const u = Math.max(rand(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const sigma = DAILY_VOL * Math.sqrt(stepDays);
  const walk = [0];
  for (let i = 1; i <= n; i++) walk.push(walk[i - 1] + gauss() * sigma);
  const end = walk[n];
  return walk.map((w, i) => {
    const t = i / n;
    const trend = from + (to - from) * t;
    return trend * (1 + (w - end * t));
  });
}

/**
 * Serie storica €/g dell'oro 24K, coerente con la quotazione corrente e la chiusura precedente.
 *
 * Serie indicativa generata in modo deterministico: per lo storico reale sostituire con la
 * lettura dallo stesso feed di mercato usato in app/api/quotes/route.ts.
 */
export function goldHistory(
  tf: Timeframe,
  current: number,
  prevClose: number,
  seedKey: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): PricePoint[] {
  const { step, points } = SPEC[tf];
  const end = Math.floor(nowSec / step) * step;

  let from: number;
  if (tf === "24H") {
    from = prevClose;
  } else {
    // Le serie 7G/30G partono da un punto della serie annua, così i timeframe restano coerenti.
    const yearly = bridge(current * (1 - YEAR_DRIFT), current, SPEC["1Y"].points - 1, 1, `${seedKey}:1Y`);
    const daysBack = (step * (points - 1)) / DAY;
    from = yearly[Math.max(0, yearly.length - 1 - Math.round(daysBack))];
  }

  const values = bridge(from, current, points - 1, step / DAY, `${seedKey}:${tf}`);
  return values.map((v, i) => ({
    time: (end - (points - 1 - i) * step) as UTCTimestamp,
    value: Math.round(v * 100) / 100,
  }));
}
