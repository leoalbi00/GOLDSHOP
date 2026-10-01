import type { NextRequest } from "next/server";
import { z } from "zod";
import { toSnapshot } from "dinero.js";
import siteData from "@/data/site-data.json";
import { estimatePayout, purityById, referenceQuotes } from "@/lib/pricing";
import { effectiveSpread } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { getStore } from "@/lib/server/store";
import { newVoucherCode } from "@/lib/server/ids";
import { clientIp, denyUnlessAdmin, error, json, rateLimited, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  purityId: z.string(),
  grams: z.number().min(0.1).max(5000),
});

/** Blocca la quotazione: l'importo è ricalcolato qui, mai preso dal client. */
export const POST = withStore(async (req: NextRequest) => {
  if (rateLimited(`voucher:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return error("Troppe richieste, riprova più tardi.", 429);
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  const purity = parsed.success ? purityById(parsed.data.purityId) : undefined;
  if (!parsed.success || !purity) return error("Dati non validi", 400);

  const store = getStore();
  const grams = Math.round(parsed.data.grams * 10) / 10;
  const { base } = referenceQuotes();
  // Spread già al netto delle promozioni attive (stagionale, lotti, Heritage VIP).
  const spread = effectiveSpread(await store.settings.getMargins(), purity, grams);
  const amountCents = toSnapshot(estimatePayout(purity, grams, base.gold24k, base.silver, spread)).amount;
  const fullCents = toSnapshot(estimatePayout(purity, grams, base.gold24k, base.silver, 0)).amount;

  const now = new Date();
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
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + siteData.pricing.voucherValidityHours * 3600_000).toISOString(),
    status: "active",
    origin: "online",
  };
  await store.vouchers.insert(voucher);
  return json(voucher, 201);
});

export const GET = withStore(async () => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  return json(await getStore().vouchers.list());
});
