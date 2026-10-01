import type { NextRequest } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/server/store";
import { clientIp, error, json, rateLimited, withStore } from "@/lib/server/http";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+\d\s]{6,20}$/),
  consent: z.literal(true),
});

/** Il cliente associa nome e cellulare al proprio voucher (ancora attivo) per essere ricontattato. */
export const POST = withStore(async (req: NextRequest, ctx: RouteContext<"/api/vouchers/[code]/contact">) => {
  if (rateLimited(`contact:${clientIp(req)}`, 20, 60 * 60 * 1000)) return error("Troppe richieste", 429);
  const { code } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Nome o numero non validi", 400);

  const now = new Date();
  const ok = await getStore().vouchers.setContact(code, { name: parsed.data.name, phone: parsed.data.phone, consentAt: now.toISOString() }, now);
  return ok ? json({ ok: true }) : error("Voucher non trovato o non più attivo", 404);
});
