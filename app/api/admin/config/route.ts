import type { NextRequest } from "next/server";
import { marginSettingsSchema, type MarginSettings } from "@/lib/margins";
import { marginStore } from "@/lib/server/repos";
import { denyUnlessAdmin, error, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Spread correnti: pubblici, perché determinano il prezzo mostrato nel calcolatore. */
export async function GET() {
  return json(await marginStore.read());
}

export async function PUT(req: NextRequest) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const parsed = marginSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Spread non validi", 400);

  const saved = await marginStore.update((current) => {
    const data: MarginSettings = {
      updatedAt: new Date().toISOString(),
      spreads: {
        ...current.spreads,
        ...Object.fromEntries(Object.entries(parsed.data.spreads).filter(([, v]) => v !== undefined)),
      } as MarginSettings["spreads"],
    };
    return { data, result: data };
  });
  return json(saved);
}
