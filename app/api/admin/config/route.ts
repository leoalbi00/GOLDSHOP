import type { NextRequest } from "next/server";
import { DEFAULT_MARGINS, marginSettingsSchema, type MarginSettings } from "@/lib/margins";
import { marginStore } from "@/lib/server/repos";
import { denyUnlessAdmin, error, json } from "@/lib/server/http";

/** Solo scrittura (titolare). La lettura pubblica è su /api/pricing. */

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const parsed = marginSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Spread non validi", 400);

  const { spreads = {}, promotions = {} } = parsed.data;
  const saved = await marginStore.update((current) => {
    const base = { ...DEFAULT_MARGINS.promotions, ...current.promotions };
    const data: MarginSettings = {
      updatedAt: new Date().toISOString(),
      spreads: {
        ...current.spreads,
        ...Object.fromEntries(Object.entries(spreads).filter(([, v]) => v !== undefined)),
      } as MarginSettings["spreads"],
      promotions: {
        seasonal: { ...base.seasonal, ...promotions.seasonal },
        heritage: { ...base.heritage, ...promotions.heritage },
      },
    };
    return { data, result: data };
  });
  return json(saved);
}
