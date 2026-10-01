import { randomBytes } from "node:crypto";
import { jsonFile } from "@/lib/server/json-store";
import { DEFAULT_MARGINS, type MarginSettings } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import type { Booking } from "@/lib/bookings";

export const marginStore = jsonFile<MarginSettings>("margin-settings.json", DEFAULT_MARGINS);
export const voucherStore = jsonFile<Voucher[]>("store/vouchers.json", []);
export const bookingStore = jsonFile<Booking[]>("store/bookings.json", []);

export function newVoucherCode(): string {
  const hex = randomBytes(4).toString("hex").toUpperCase();
  return `CO123-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

export function newId(): string {
  return randomBytes(8).toString("hex");
}
