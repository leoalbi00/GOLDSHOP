import { bookableDays } from "@/lib/bookings";
import { bookingStore } from "@/lib/server/repos";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Giorni e fasce ancora libere: solo orari, nessun dato dei clienti. */
export async function GET() {
  const taken = new Set(
    (await bookingStore.read()).filter((b) => b.status !== "cancelled").map((b) => `${b.date} ${b.time}`),
  );
  const days = bookableDays()
    .map((d) => ({ date: d.date, slots: d.slots.filter((t) => !taken.has(`${d.date} ${t}`)) }))
    .filter((d) => d.slots.length > 0);
  return json(days);
}
