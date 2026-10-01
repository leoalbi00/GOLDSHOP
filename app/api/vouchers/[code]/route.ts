import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkPayment, isValidTaxCode } from "@/lib/compliance-checker";
import { voucherState, type OamRecord, type Voucher } from "@/lib/vouchers";
import { voucherStore } from "@/lib/server/repos";
import { denyUnlessAdmin, error, json } from "@/lib/server/http";

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

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/vouchers/[code]">) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { code } = await ctx.params;
  const v = (await voucherStore.read()).find((x) => x.code === code);
  return v ? json(v) : error("Voucher non trovato", 404);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/vouchers/[code]">) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { code } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Dati non validi", 400);
  const body = parsed.data;

  if (body.action === "oam") {
    if (body.oam.netWeight > body.oam.grossWeight) return error("Il peso netto supera il peso lordo", 400);
    const compliance = checkPayment(body.oam.pricePaidCents, body.oam.paymentMethod);
    if (!compliance.ok) return error(compliance.message, 422);
  }

  const result = await voucherStore.update<Voucher | string>((list) => {
    const v = list.find((x) => x.code === code);
    if (!v) return { data: list, result: "Voucher non trovato" };
    if (body.action === "complete") {
      const state = voucherState(v);
      if (state !== "active") {
        return { data: list, result: state === "expired" ? "Voucher scaduto" : "Voucher già completato" };
      }
      v.status = "completed";
      v.completedAt = new Date().toISOString();
    } else {
      const oam: OamRecord = { ...body.oam, recordedAt: new Date().toISOString() };
      v.oam = oam;
    }
    return { data: list, result: v };
  });
  return typeof result === "string" ? error(result, result === "Voucher non trovato" ? 404 : 409) : json(result);
}
