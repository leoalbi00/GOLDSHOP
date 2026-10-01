import type { NextRequest } from "next/server";
import { z } from "zod";
import { bookingStore } from "@/lib/server/repos";
import { denyUnlessAdmin, error, json } from "@/lib/server/http";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = z.object({ status: z.enum(["confirmed", "cancelled"]) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Stato non valido", 400);
  const found = await bookingStore.update((list) => {
    const b = list.find((x) => x.id === id);
    if (b) b.status = parsed.data.status;
    return { data: list, result: !!b };
  });
  return found ? json({ ok: true }) : error("Prenotazione non trovata", 404);
}
