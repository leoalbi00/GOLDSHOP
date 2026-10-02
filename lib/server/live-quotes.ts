import "server-only";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { buildQuotes, referenceQuotes, type QuotesPayload } from "@/lib/pricing";
import { getStore } from "@/lib/server/store";
import type { QuoteState } from "@/lib/server/store/types";

dayjs.extend(utc);
dayjs.extend(timezone);

const FEED = "https://api.gold-api.com/price";
const TROY_OUNCE_G = 31.1034768;
/** Il feed si aggiorna di continuo: un minuto di cache basta e rispetta i limiti del servizio gratuito. */
const REVALIDATE_S = 60;
/** Ogni quanto salvare l'ultimo prezzo del giorno (serve come chiusura per il giorno dopo). */
const SAVE_EVERY_MS = 10 * 60_000;

interface FeedPrice {
  price: number;
  updatedAt: string;
}

async function spot(symbol: "XAU" | "XAG"): Promise<FeedPrice> {
  const res = await fetch(`${FEED}/${symbol}/EUR`, {
    next: { revalidate: REVALIDATE_S },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`gold-api ${symbol}: HTTP ${res.status}`);
  const data = (await res.json()) as Partial<FeedPrice>;
  if (typeof data.price !== "number" || !(data.price > 0)) throw new Error(`gold-api ${symbol}: prezzo non valido`);
  return { price: data.price, updatedAt: data.updatedAt ?? new Date().toISOString() };
}

const perGram = (eurPerOunce: number, decimals: number) => Number((eurPerOunce / TROY_OUNCE_G).toFixed(decimals));

/**
 * Aggiorna lo stato salvato: al cambio di giorno l'ultimo prezzo di ieri diventa la chiusura precedente,
 * e un nuovo record dell'oro sostituisce il massimo storico. Senza archivio scrivibile non salva nulla.
 */
async function trackState(now: { gold24k: number; silver: number }, at: dayjs.Dayjs, recordAth: QuotesPayload["allTimeHigh"]) {
  const store = getStore();
  const today = at.tz("Europe/Rome").format("YYYY-MM-DD");
  let saved: QuoteState | null = null;
  try {
    saved = await store.settings.getQuoteState();
  } catch {
    saved = null;
  }

  const ath = [saved?.ath, recordAth].reduce<QuoteState["ath"]>((best, a) => (a && (!best || a.gold24k > best.gold24k) ? a : best), undefined)!;
  const newRecord = now.gold24k > ath.gold24k;
  const next: QuoteState = {
    day: today,
    savedAt: at.toISOString(),
    last: now,
    prev: saved && saved.day !== today ? saved.last : saved?.prev,
    ath: newRecord ? { gold24k: now.gold24k, date: today } : ath,
  };

  const due = !saved || saved.day !== today || newRecord || at.diff(dayjs(saved.savedAt)) >= SAVE_EVERY_MS;
  if (due) {
    try {
      await store.settings.setQuoteState(next);
    } catch {
      // Archivio non disponibile (es. Vercel senza database): le quotazioni restano valide, senza storico.
    }
  }
  return next;
}

/** Quotazioni live da gold-api.com (spot XAU/XAG in euro); se il feed non risponde, i valori di riferimento. */
export async function getLiveQuotes(): Promise<QuotesPayload> {
  const reference = referenceQuotes();
  try {
    const [gold, silver] = await Promise.all([spot("XAU"), spot("XAG")]);
    const now = { gold24k: perGram(gold.price, 2), silver: perGram(silver.price, 3) };
    const updatedAt = dayjs(gold.updatedAt);
    const state = await trackState(now, updatedAt.isValid() ? updatedAt : dayjs(), reference.allTimeHigh);
    const prev = state.prev ?? now;
    return {
      updatedAt: updatedAt.isValid() ? updatedAt.toISOString() : new Date().toISOString(),
      source: "feed",
      base: now,
      prev,
      quotes: buildQuotes(now.gold24k, now.silver, prev),
      allTimeHigh: state.ath ?? reference.allTimeHigh,
    };
  } catch (e) {
    console.error("Quotazioni live non disponibili, uso i valori di riferimento:", e);
    return reference;
  }
}
