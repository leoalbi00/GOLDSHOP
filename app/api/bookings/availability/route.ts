import { bookableDays } from "@/lib/bookings";
import { getStore } from "@/lib/server/store";
import { json, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Giorni e fasce ancora libere: solo orari, nessun dato dei clienti. */
export const GET = withStore(async () => {
  const days = bookableDays();
  const taken = await getStore().bookings.takenSlots(days[0]?.date ?? new Date().toISOString().slice(0, 10));
  return json(
    days.map((d) => ({ date: d.date, slots: d.slots.filter((t) => !taken.has(`${d.date} ${t}`)) })).filter((d) => d.slots.length > 0),
  );
});
