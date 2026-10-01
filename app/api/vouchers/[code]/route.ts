import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkPayment, isValidTaxCode } from "@/lib/compliance-checker";
import type { OamRecord } from "@/lib/vouchers";
import { getStore } from "@/lib/server/store";
import { denyUnlessAdmin, error, json, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const text = (max: number) => z.string().trim().min(1).max(max);

const oamSchema = z.object({
  firstName: text(60),
  lastName: text(60),
  taxCode: z.string().trim().toUpperCase().refine(isValidTaxCode, "Codice fiscale non valido"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthPlace: text(80),
  address: text(160),
  docType: text(40),
  docNumber: text(30),
  docIssuer: text(80),
  docExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  itemsDescription: text(600),
  grossWeight: z.number().positive().max(100000),
  netWeight: z.number().positive().max(100000),
  pricePaidCents: z.number().int().positive(),
  paymentMethod: z.enum(["contanti", "bonifico", "assegno"]),
  paymentReference: z.string().trim().max(80).default(""),
  provenanceDeclared: z.literal(true),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("oam"), oam: oamSchema }),
]);

const REASON = { not_found: ["Voucher non trovato", 404], expired: ["Voucher scaduto", 409], completed: ["Voucher già completato", 409] } as const;

export const GET = withStore(async (_req: NextRequest, ctx: RouteContext<"/api/vouchers/[code]">) => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { code } = await ctx.params;
  const v = await getStore().vouchers.get(code);
  return v ? json(v) : error("Voucher non trovato", 404);
});

export const PATCH = withStore(async (req: NextRequest, ctx: RouteContext<"/api/vouchers/[code]">) => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { code } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Dati non validi", 400);
  const body = parsed.data;
  const store = getStore();

  if (body.action === "complete") {
    const result = await store.vouchers.complete(code, new Date());
    if (result.ok) return json(result.voucher);
    const [message, status] = REASON[result.reason];
    return error(message, status);
  }

  if (body.oam.netWeight > body.oam.grossWeight) return error("Il peso netto supera il peso lordo", 400);
  const compliance = checkPayment(body.oam.pricePaidCents, body.oam.paymentMethod);
  if (!compliance.ok) return error(compliance.message, 422);
  const oam: OamRecord = { ...body.oam, recordedAt: new Date().toISOString() };
  const updated = await store.vouchers.setOam(code, oam);
  return updated ? json(updated) : error("Voucher non trovato", 404);
});
