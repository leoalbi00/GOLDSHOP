import type { NextRequest } from "next/server";
import { z } from "zod";
import { voucherState } from "@/lib/vouchers";
import { voucherStore } from "@/lib/server/repos";
import { clientIp, error, json, rateLimited } from "@/lib/server/http";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+\d\s]{6,20}$/),
  consent: z.literal(true),
});

/** Il cliente associa nome e cellulare al proprio voucher (ancora attivo) per essere ricontattato. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/vouchers/[code]/contact">) {
  if (rateLimited(`contact:${clientIp(req)}`, 20, 60 * 60 * 1000)) return error("Troppe richieste", 429);
  const { code } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Nome o numero non validi", 400);

  const result = await voucherStore.update((list) => {
    const v = list.find((x) => x.code === code);
    if (!v || voucherState(v) !== "active") return { data: list, result: false };
    v.contact = { name: parsed.data.name, phone: parsed.data.phone, consentAt: new Date().toISOString() };
    return { data: list, result: true };
  });
  return result ? json({ ok: true }) : error("Voucher non trovato o non più attivo", 404);
}
