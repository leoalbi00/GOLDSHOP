import { z } from "zod";
import defaults from "@/data/margin-settings.json";
import { PURITIES } from "@/lib/pricing";

/** Spread in €/g sottratto alla quotazione del titolo, per ogni caratura. */
export type Spreads = Record<string, number>;

export interface MarginSettings {
  updatedAt: string;
  spreads: Spreads;
}

export const DEFAULT_MARGINS: MarginSettings = defaults;

export const marginSettingsSchema = z.object({
  spreads: z.partialRecord(
    z.enum(PURITIES.map((p) => p.id) as [string, ...string[]]),
    z.number().min(0).max(1000),
  ),
});

export function spreadFor(settings: MarginSettings, purityId: string): number {
  return settings.spreads[purityId] ?? DEFAULT_MARGINS.spreads[purityId] ?? 0;
}
