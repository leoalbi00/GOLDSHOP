import type { NextRequest } from "next/server";
import { marginSettingsSchema, type MarginSettings } from "@/lib/margins";
import { getStore } from "@/lib/server/store";
import { denyUnlessAdmin, error, json, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Solo scrittura (titolare). La lettura pubblica è su /api/pricing. */
export const PUT = withStore(async (req: NextRequest) => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const parsed = marginSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Impostazioni non valide", 400);

  const { spreads = {}, promotions = {} } = parsed.data;
  const saved = await getStore().settings.updateMargins(
    (current): MarginSettings => ({
      updatedAt: new Date().toISOString(),
      spreads: {
        ...current.spreads,
        ...Object.fromEntries(Object.entries(spreads).filter(([, v]) => v !== undefined)),
      } as MarginSettings["spreads"],
      promotions: {
        seasonal: { ...current.promotions.seasonal, ...promotions.seasonal },
        heritage: { ...current.promotions.heritage, ...promotions.heritage },
        bulk: { ...current.promotions.bulk, ...promotions.bulk },
      },
    }),
  );
  return json(saved);
});
