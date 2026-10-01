import type { NextRequest } from "next/server";
import { z } from "zod";
import { isBookable } from "@/lib/bookings";
import { getStore } from "@/lib/server/store";
import { denyUnlessAdmin, error, json, withStore } from "@/lib/server/http";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), status: z.enum(["confirmed", "completed", "cancelled"]) }),
  z.object({
    action: z.literal("reschedule"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

export const PATCH = withStore(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Richiesta non valida", 400);
  const body = parsed.data;
  const store = getStore();

  if (body.action === "status") {
    const b = await store.bookings.setStatus(id, body.status);
    return b ? json(b) : error("Prenotazione non trovata", 404);
  }
  if (!isBookable(body.date, body.time)) return error("Fascia oraria non prenotabile", 409);
  const result = await store.bookings.reschedule(id, body.date, body.time);
  if (result === "not_found") return error("Prenotazione non trovata", 404);
  if (result === "taken") return error("Fascia già occupata", 409);
  return json(result);
});
