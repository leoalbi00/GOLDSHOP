import type { NextRequest } from "next/server";
import { z } from "zod";
import { toSnapshot } from "dinero.js";
import { estimatePayout, purityById } from "@/lib/pricing";
import { getLiveQuotes } from "@/lib/server/live-quotes";
import { effectiveSpread } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { getStore } from "@/lib/server/store";
import { newVoucherCode } from "@/lib/server/ids";
import { denyUnlessAdmin, error, json, withStore } from "@/lib/server/http";

const schema = z.object({ purityId: z.string(), grams: z.number().min(0.01).max(100000) });

/** Operazione al banco per un cliente senza voucher: nasce già conclusa, pronta per la scheda OAM. */
export const POST = withStore(async (req: NextRequest) => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  const purity = parsed.success ? purityById(parsed.data.purityId) : undefined;
  if (!parsed.success || !purity) return error("Caratura o peso non validi", 400);

  const { grams } = parsed.data;
  const { base } = await getLiveQuotes();
  const store = getStore();
  const spread = effectiveSpread(await store.settings.getMargins(), purity, grams);
  const amountCents = toSnapshot(estimatePayout(purity, grams, base.gold24k, base.silver, spread)).amount;
  const fullCents = toSnapshot(estimatePayout(purity, grams, base.gold24k, base.silver, 0)).amount;
  const now = new Date().toISOString();

  const voucher: Voucher = {
    code: newVoucherCode(),
    purityId: purity.id,
    purityLabel: purity.label,
    metal: purity.metal,
    grams,
    amountCents,
    marginCents: fullCents - amountCents,
    spreadPerGram: spread,
    baseAtLock: purity.metal === "gold" ? base.gold24k : base.silver,
    createdAt: now,
    expiresAt: now,
    status: "completed",
    origin: "banco",
    completedAt: now,
  };
  await store.vouchers.insert(voucher);
  return json(voucher, 201);
});
