import type { NextRequest } from "next/server";
import { z } from "zod";
import { toSnapshot } from "dinero.js";
import BigNumber from "bignumber.js";
import siteData from "@/data/site-data.json";
import { estimatePayout, purityById, referenceQuotes } from "@/lib/pricing";
import { spreadFor } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { marginStore, newVoucherCode, voucherStore } from "@/lib/server/repos";
import { clientIp, denyUnlessAdmin, error, json, rateLimited } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  purityId: z.string(),
  grams: z.number().min(0.1).max(5000),
});

/** Blocca la quotazione: l'importo è ricalcolato qui, mai preso dal client. */
export async function POST(req: NextRequest) {
  if (rateLimited(`voucher:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return error("Troppe richieste, riprova più tardi.", 429);
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  const purity = parsed.success ? purityById(parsed.data.purityId) : undefined;
  if (!parsed.success || !purity) return error("Dati non validi", 400);

  const grams = Math.round(parsed.data.grams * 10) / 10;
  const { base } = referenceQuotes();
  const spread = spreadFor(await marginStore.read(), purity.id);
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
    spreadPerGram: new BigNumber(spread).toNumber(),
    baseAtLock: purity.metal === "gold" ? base.gold24k : base.silver,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + siteData.pricing.voucherValidityHours * 3600_000).toISOString(),
    status: "active",
  };
  await voucherStore.update((list) => ({ data: [...list, voucher], result: null }));
  return json(voucher, 201);
}

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const list = await voucherStore.read();
  return json([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
