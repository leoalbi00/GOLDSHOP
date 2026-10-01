import type { NextRequest } from "next/server";
import { z } from "zod";
import { isBookable, type Booking } from "@/lib/bookings";
import { bookingStore } from "@/lib/server/repos";
import { denyUnlessAdmin, error, json } from "@/lib/server/http";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), status: z.enum(["confirmed", "completed", "cancelled"]) }),
  z.object({
    action: z.literal("reschedule"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Richiesta non valida", 400);
  const body = parsed.data;
  if (body.action === "reschedule" && !isBookable(body.date, body.time)) return error("Fascia oraria non prenotabile", 409);

  const result = await bookingStore.update<Booking | string>((list) => {
    const b = list.find((x) => x.id === id);
    if (!b) return { data: list, result: "Prenotazione non trovata" };
    if (body.action === "status") {
      b.status = body.status;
    } else {
      const taken = list.some((x) => x.id !== id && x.status !== "cancelled" && x.date === body.date && x.time === body.time);
      if (taken) return { data: list, result: "Fascia già occupata" };
      b.date = body.date;
      b.time = body.time;
      // Un appuntamento spostato va riconfermato al cliente.
      b.status = "requested";
    }
    return { data: list, result: b };
  });
  return typeof result === "string" ? error(result, result === "Prenotazione non trovata" ? 404 : 409) : json(result);
}
