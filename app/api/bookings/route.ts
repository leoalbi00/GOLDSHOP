import type { NextRequest } from "next/server";
import { bookingInputSchema, isBookable, type Booking } from "@/lib/bookings";
import { getStore } from "@/lib/server/store";
import { newId } from "@/lib/server/ids";
import { clientIp, denyUnlessAdmin, error, json, rateLimited, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const POST = withStore(async (req: NextRequest) => {
  if (rateLimited(`booking:${clientIp(req)}`, 5, 60 * 60 * 1000)) return error("Troppe richieste, riprova più tardi.", 429);
  const parsed = bookingInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Controlla i dati inseriti", 400);
  const { consent: _consent, ...input } = parsed.data;
  if (!isBookable(input.date, input.time)) return error("Fascia oraria non disponibile", 409);

  const booking: Booking = { ...input, id: newId(), createdAt: new Date().toISOString(), status: "requested" };
  const ok = await getStore().bookings.insert(booking);
  return ok ? json({ id: booking.id, date: booking.date, time: booking.time }, 201) : error("Fascia appena prenotata da un altro cliente", 409);
});

export const GET = withStore(async () => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  return json(await getStore().bookings.list());
});
