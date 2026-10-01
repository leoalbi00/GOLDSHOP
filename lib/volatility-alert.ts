import siteData from "@/data/site-data.json";
import type { Voucher } from "@/lib/vouchers";

export const VOLATILITY_THRESHOLD_PCT = siteData.pricing.volatilityAlertPct;

export interface VolatilityAlert {
  /** Variazione % della quotazione attuale rispetto a quella del blocco. */
  changePct: number;
  /** Oltre soglia: il prezzo bloccato si discosta troppo dal mercato. */
  alert: boolean;
  /** Il mercato è sceso: il negozio paga più del valore attuale e il margine si riduce. */
  marginAtRisk: boolean;
}

export function volatilityFor(v: Pick<Voucher, "metal" | "baseAtLock">, gold24k: number, silver: number): VolatilityAlert {
  const now = v.metal === "gold" ? gold24k : silver;
  const changePct = v.baseAtLock ? ((now - v.baseAtLock) / v.baseAtLock) * 100 : 0;
  const alert = Math.abs(changePct) >= VOLATILITY_THRESHOLD_PCT;
  return { changePct, alert, marginAtRisk: alert && changePct < 0 };
}
