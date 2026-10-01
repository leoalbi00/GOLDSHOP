import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/it";
import siteData from "@/data/site-data.json";

dayjs.extend(utc);
dayjs.extend(timezone);

export const STORE_TZ = "Europe/Rome";
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function slotsOn(d: Dayjs) {
  return siteData.openingHoursSpecification.filter((o) => o.days.includes(DAY_NAMES[d.day()]));
}

export interface StoreStatus {
  open: boolean;
  /** Orario di chiusura della fascia in corso, se aperto. */
  closesAt?: string;
  /** Prossima apertura, se chiuso. */
  reopens?: { time: string; when: "oggi" | "domani" | string };
}

/** Stato del negozio calcolato nel fuso di Bergamo, indipendente dal fuso del visitatore. */
export function storeStatus(now: Dayjs = dayjs()): StoreStatus {
  const local = now.tz(STORE_TZ);
  const minutes = local.hour() * 60 + local.minute();
  const today = slotsOn(local);
  const current = today.find((o) => minutes >= toMin(o.opens) && minutes < toMin(o.closes));
  if (current) return { open: true, closesAt: current.closes };
  const later = today.find((o) => minutes < toMin(o.opens));
  if (later) return { open: false, reopens: { time: later.opens, when: "oggi" } };
  for (let i = 1; i <= 7; i++) {
    const d = local.add(i, "day");
    const slot = slotsOn(d)[0];
    if (slot) return { open: false, reopens: { time: slot.opens, when: i === 1 ? "domani" : d.locale("it").format("dddd") } };
  }
  return { open: false };
}
