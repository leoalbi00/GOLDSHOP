import type { NextRequest } from "next/server";
import { bookingInputSchema, isBookable, type Booking } from "@/lib/bookings";
import { bookingStore, newId } from "@/lib/server/repos";
import { clientIp, denyUnlessAdmin, error, json, rateLimited } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (rateLimited(`booking:${clientIp(req)}`, 5, 60 * 60 * 1000)) return error("Troppe richieste, riprova più tardi.", 429);
  const parsed = bookingInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Controlla i dati inseriti", 400);
  const { consent: _consent, ...input } = parsed.data;
  if (!isBookable(input.date, input.time)) return error("Fascia oraria non disponibile", 409);

  const result = await bookingStore.update<Booking | null>((list) => {
    const taken = list.some((b) => b.status !== "cancelled" && b.date === input.date && b.time === input.time);
    if (taken) return { data: list, result: null };
    const booking: Booking = { ...input, id: newId(), createdAt: new Date().toISOString(), status: "requested" };
    return { data: [...list, booking], result: booking };
  });
  return result ? json({ id: result.id, date: result.date, time: result.time }, 201) : error("Fascia appena prenotata da un altro cliente", 409);
}

export async function GET() {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const list = await bookingStore.read();
  return json([...list].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
}
