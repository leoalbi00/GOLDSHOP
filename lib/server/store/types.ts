import type { Booking } from "@/lib/bookings";
import type { MarginSettings } from "@/lib/margins";
import type { OamRecord, Voucher } from "@/lib/vouchers";

export type CompleteResult = { ok: true; voucher: Voucher } | { ok: false; reason: "not_found" | "expired" | "completed" };

/**
 * Archivio dell'applicazione. Ogni operazione che deve essere atomica (completare un voucher una sola volta,
 * prenotare una fascia libera) è un metodo a sé: l'implementazione Postgres la risolve con un'unica query.
 */
export interface Store {
  vouchers: {
    /** Dal più recente. */
    list(): Promise<Voucher[]>;
    get(code: string): Promise<Voucher | null>;
    insert(v: Voucher): Promise<void>;
    /** Conclude solo se attivo e non scaduto. */
    complete(code: string, now: Date): Promise<CompleteResult>;
    /** Associa il contatto solo a un voucher ancora attivo. */
    setContact(code: string, contact: NonNullable<Voucher["contact"]>, now: Date): Promise<boolean>;
    setOam(code: string, oam: OamRecord): Promise<Voucher | null>;
  };
  bookings: {
    /** In ordine di data e ora. */
    list(): Promise<Booking[]>;
    /** Fasce occupate ("YYYY-MM-DD HH:mm") da oggi in poi. */
    takenSlots(fromDate: string): Promise<Set<string>>;
    /** false se la fascia è già occupata. */
    insert(b: Booking): Promise<boolean>;
    setStatus(id: string, status: Booking["status"]): Promise<Booking | null>;
    reschedule(id: string, date: string, time: string): Promise<Booking | "not_found" | "taken">;
  };
  settings: {
    getMargins(): Promise<MarginSettings>;
    updateMargins(fn: (current: MarginSettings) => MarginSettings): Promise<MarginSettings>;
  };
  /** Tentativi di login falliti: per IP e globali. */
  limiter: {
    lockMinutes(ip: string): Promise<number>;
    /** Registra un errore e restituisce i tentativi rimasti per l'IP. */
    fail(ip: string): Promise<number>;
    clear(ip: string): Promise<void>;
  };
}

export const LOGIN_LIMITS = { perIp: 3, global: 20, windowS: 15 * 60 } as const;

/** Archivio non scrivibile (es. Vercel senza database collegato). */
export class StoreUnavailableError extends Error {
  constructor() {
    super("Archivio non configurato: collega un database (DATABASE_URL) al progetto.");
  }
}

/** Unisce le impostazioni salvate ai valori predefiniti, così le nuove promozioni hanno sempre un valore. */
export function withMarginDefaults(saved: Partial<MarginSettings> | null, defaults: MarginSettings): MarginSettings {
  return {
    updatedAt: saved?.updatedAt ?? defaults.updatedAt,
    spreads: { ...defaults.spreads, ...saved?.spreads },
    promotions: {
      seasonal: { ...defaults.promotions.seasonal, ...saved?.promotions?.seasonal },
      heritage: { ...defaults.promotions.heritage, ...saved?.promotions?.heritage },
      bulk: { ...defaults.promotions.bulk, ...saved?.promotions?.bulk },
      vip: { ...defaults.promotions.vip, ...saved?.promotions?.vip },
    },
  };
}
