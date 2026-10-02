import { z } from "zod";
import defaults from "@/data/margin-settings.json";
import { PURITIES, type Purity } from "@/lib/pricing";

/** Spread in €/g sottratto alla quotazione del titolo, per ogni caratura. */
export type Spreads = Record<string, number>;

export interface Promotions {
  /** "Special Summer / Winter": bonus €/g sulle carature indicate (default oro 18K). */
  seasonal: { active: boolean; season: "summer" | "winter"; bonusPerGram: number; purityIds: string[] };
  /** "Heritage VIP": bonus €/g sui lotti d'oro oltre la soglia, con valutazione riservata. */
  heritage: { active: boolean; minGrams: number; bonusPerGram: number };
  /** "Bonus lotti": bonus €/g sui lotti d'oro oltre la soglia (es. +1,00 €/g oltre 50 g). */
  bulk: { active: boolean; minGrams: number; bonusPerGram: number };
}

export interface MarginSettings {
  updatedAt: string;
  spreads: Spreads;
  promotions: Promotions;
}

export const DEFAULT_MARGINS = defaults as MarginSettings;

const purityId = z.enum(PURITIES.map((p) => p.id) as [string, ...string[]]);

export const marginSettingsSchema = z.object({
  spreads: z.partialRecord(purityId, z.number().min(0).max(1000)).optional(),
  promotions: z
    .object({
      seasonal: z
        .object({
          active: z.boolean(),
          season: z.enum(["summer", "winter"]),
          bonusPerGram: z.number().min(0).max(20),
          purityIds: z.array(purityId).min(1),
        })
        .partial()
        .optional(),
      heritage: z
        .object({ active: z.boolean(), minGrams: z.number().min(1).max(100000), bonusPerGram: z.number().min(0).max(20) })
        .partial()
        .optional(),
      bulk: z
        .object({ active: z.boolean(), minGrams: z.number().min(1).max(100000), bonusPerGram: z.number().min(0).max(20) })
        .partial()
        .optional(),
    })
    .optional(),
});

export const SEASON_LABEL = { summer: "Special Summer", winter: "Special Winter" } as const;

export function spreadFor(settings: MarginSettings, purityId: string): number {
  return settings.spreads[purityId] ?? DEFAULT_MARGINS.spreads[purityId] ?? 0;
}

export interface AppliedPromo {
  id: "seasonal" | "heritage" | "bulk";
  label: string;
  bonusPerGram: number;
}

/** Promozioni attive che si applicano a questa caratura e a questo peso. */
export function promosFor(settings: MarginSettings, purity: Purity, grams: number): AppliedPromo[] {
  const p = { ...DEFAULT_MARGINS.promotions, ...settings.promotions };
  const out: AppliedPromo[] = [];
  if (p.seasonal.active && p.seasonal.purityIds.includes(purity.id)) {
    out.push({ id: "seasonal", label: SEASON_LABEL[p.seasonal.season], bonusPerGram: p.seasonal.bonusPerGram });
  }
  if (p.bulk.active && purity.metal === "gold" && grams > p.bulk.minGrams) {
    out.push({ id: "bulk", label: "Bonus lotti", bonusPerGram: p.bulk.bonusPerGram });
  }
  if (p.heritage.active && purity.metal === "gold" && grams > p.heritage.minGrams) {
    out.push({ id: "heritage", label: "Heritage VIP", bonusPerGram: p.heritage.bonusPerGram });
  }
  return out;
}

/**
 * Spread effettivo dopo le promozioni. Mai sotto zero: il negozio non paga più della quotazione di Borsa.
 * Usato sia dal calcolatore pubblico sia dal server che emette i voucher.
 */
export function effectiveSpread(settings: MarginSettings, purity: Purity, grams: number): number {
  const bonus = promosFor(settings, purity, grams).reduce((s, p) => s + p.bonusPerGram, 0);
  return Math.max(0, Math.round((spreadFor(settings, purity.id) - bonus) * 100) / 100);
}
