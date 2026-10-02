import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import type { Booking } from "@/lib/bookings";
import { DEFAULT_MARGINS, type MarginSettings } from "@/lib/margins";
import { voucherState, type Voucher } from "@/lib/vouchers";
import { jsonFile } from "@/lib/server/json-store";
import { LOGIN_LIMITS, StoreUnavailableError, withMarginDefaults, type CompleteResult, type QuoteState, type Store } from "@/lib/server/store/types";

/**
 * Archivio su file JSON in data/ per lo sviluppo locale (o un server proprio con disco persistente).
 * Su Vercel il disco non è scrivibile: le scritture falliscono con un errore chiaro.
 */
export function createFileStore(readOnly: boolean): Store {
  const vouchers = jsonFile<Voucher[]>("store/vouchers.json", []);
  const bookings = jsonFile<Booking[]>("store/bookings.json", []);
  const quoteState = jsonFile<QuoteState | null>("store/quote-state.json", null);
  const margins = jsonFile<MarginSettings>("margin-settings.json", DEFAULT_MARGINS);
  const guard = () => {
    if (readOnly) throw new StoreUnavailableError();
  };

  const g = globalThis as { __co123Ip?: RateLimiterMemory; __co123All?: RateLimiterMemory };
  const perIp = (g.__co123Ip ??= new RateLimiterMemory({ keyPrefix: "login-ip", points: LOGIN_LIMITS.perIp, duration: LOGIN_LIMITS.windowS, blockDuration: LOGIN_LIMITS.windowS }));
  const all = (g.__co123All ??= new RateLimiterMemory({ keyPrefix: "login-all", points: LOGIN_LIMITS.global, duration: LOGIN_LIMITS.windowS, blockDuration: LOGIN_LIMITS.windowS }));
  const blockedFor = (res: RateLimiterRes | null) => (res && res.remainingPoints <= 0 ? Math.max(1, Math.ceil(res.msBeforeNext / 60000)) : 0);
  const consume = async (l: RateLimiterMemory, key: string) => {
    try {
      return (await l.consume(key)).remainingPoints;
    } catch (e) {
      if (e instanceof RateLimiterRes) return 0;
      throw e;
    }
  };

  return {
    vouchers: {
      list: async () => [...(await vouchers.read())].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      get: async (code) => (await vouchers.read()).find((v) => v.code === code) ?? null,
      async insert(v) {
        guard();
        await vouchers.update((list) => ({ data: [...list, v], result: null }));
      },
      async complete(code, now) {
        guard();
        return vouchers.update<CompleteResult>((list) => {
          const v = list.find((x) => x.code === code);
          if (!v) return { data: list, result: { ok: false, reason: "not_found" } };
          const state = voucherState(v, now);
          if (state !== "active") return { data: list, result: { ok: false, reason: state } };
          v.status = "completed";
          v.completedAt = now.toISOString();
          return { data: list, result: { ok: true, voucher: v } };
        });
      },
      async setContact(code, contact, now) {
        guard();
        return vouchers.update((list) => {
          const v = list.find((x) => x.code === code);
          if (!v || voucherState(v, now) !== "active") return { data: list, result: false };
          v.contact = contact;
          return { data: list, result: true };
        });
      },
      async setOam(code, oam) {
        guard();
        return vouchers.update((list) => {
          const v = list.find((x) => x.code === code);
          if (v) v.oam = oam;
          return { data: list, result: v ?? null };
        });
      },
    },

    bookings: {
      list: async () => [...(await bookings.read())].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
      takenSlots: async (fromDate) =>
        new Set((await bookings.read()).filter((b) => b.status !== "cancelled" && b.date >= fromDate).map((b) => `${b.date} ${b.time}`)),
      async insert(b) {
        guard();
        return bookings.update((list) => {
          const taken = list.some((x) => x.status !== "cancelled" && x.date === b.date && x.time === b.time);
          return taken ? { data: list, result: false } : { data: [...list, b], result: true };
        });
      },
      async setStatus(id, status) {
        guard();
        return bookings.update((list) => {
          const b = list.find((x) => x.id === id);
          if (b) b.status = status;
          return { data: list, result: b ?? null };
        });
      },
      async reschedule(id, date, time) {
        guard();
        return bookings.update<Booking | "not_found" | "taken">((list) => {
          const b = list.find((x) => x.id === id && x.status !== "cancelled");
          if (!b) return { data: list, result: "not_found" };
          if (list.some((x) => x.id !== id && x.status !== "cancelled" && x.date === date && x.time === time)) {
            return { data: list, result: "taken" };
          }
          Object.assign(b, { date, time, status: "requested" });
          return { data: list, result: b };
        });
      },
    },

    settings: {
      getMargins: async () => withMarginDefaults(await margins.read(), DEFAULT_MARGINS),
      async updateMargins(fn) {
        guard();
        return margins.update((current) => {
          const next = fn(withMarginDefaults(current, DEFAULT_MARGINS));
          return { data: next, result: next };
        });
      },
      getQuoteState: () => quoteState.read(),
      async setQuoteState(state) {
        guard();
        await quoteState.update(() => ({ data: state, result: undefined }));
      },
    },

    limiter: {
      lockMinutes: async (ip) => Math.max(blockedFor(await perIp.get(ip)), blockedFor(await all.get("all"))),
      async fail(ip) {
        await consume(all, "all");
        return consume(perIp, ip);
      },
      async clear(ip) {
        await perIp.delete(ip);
      },
    },
  };
}
