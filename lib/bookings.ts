import { RRule } from "rrule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";
import { STORE_TZ } from "@/lib/store-hours";

dayjs.extend(utc);
dayjs.extend(timezone);

export const LOT_TYPES = [
  "Eredità o patrimonio di famiglia",
  "Orologi di pregio",
  "Lingotti e monete",
  "Gioielli importanti",
  "Altro",
] as const;

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD, ora di Roma
  time: string; // HH:mm
  name: string;
  phone: string;
  lotType: (typeof LOT_TYPES)[number];
  estimate: string;
  notes: string;
  privateRoom: boolean;
  createdAt: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
}

export const bookingInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+\d\s]{6,20}$/),
  lotType: z.enum(LOT_TYPES),
  estimate: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(500).default(""),
  privateRoom: z.boolean().default(true),
  consent: z.literal(true),
});

/** Fasce riservate di un'ora, dentro l'orario del negozio; il sabato solo su appuntamento. */
const WEEKDAY_SLOTS = ["09:30", "10:30", "11:30", "15:00", "16:00", "17:00"];
const SATURDAY_SLOTS = ["09:30", "10:30", "11:30"];
const HORIZON_DAYS = 21;
/** Preavviso minimo per organizzare l'ufficio riservato. */
const MIN_NOTICE_H = 3;

export interface DaySlots {
  date: string;
  slots: string[];
}

export function bookableDays(now: Date = new Date()): DaySlots[] {
  const today = dayjs(now).tz(STORE_TZ);
  const rule = new RRule({
    freq: RRule.DAILY,
    byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA],
    dtstart: new Date(Date.UTC(today.year(), today.month(), today.date())),
    count: HORIZON_DAYS,
  });
  const earliest = dayjs(now).add(MIN_NOTICE_H, "hour");
  return rule
    .all()
    .map((d) => {
      const date = d.toISOString().slice(0, 10);
      const base = d.getUTCDay() === 6 ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
      const slots = base.filter((t) => dayjs.tz(`${date} ${t}`, STORE_TZ).isAfter(earliest));
      return { date, slots };
    })
    .filter((d) => d.slots.length > 0);
}

export function isBookable(date: string, time: string, now: Date = new Date()): boolean {
  return bookableDays(now).some((d) => d.date === date && d.slots.includes(time));
}
