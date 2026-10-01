import { NextResponse, type NextRequest } from "next/server";
import { StoreUnavailableError } from "@/lib/server/store/types";
import { getAdminSession } from "@/lib/auth/server";

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export const error = (message: string, status: number) => json({ error: message }, status);

/** Restituisce una risposta 401 se la richiesta non ha una sessione admin valida. */
export async function denyUnlessAdmin(): Promise<NextResponse | null> {
  return (await getAdminSession()) ? null : error("Accesso riservato", 401);
}

/** Limite semplice a finestra fissa per IP, per le route pubbliche che scrivono su disco. */
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  h.n += 1;
  return h.n > max;
}

/**
 * Avvolge una route: un archivio non configurato diventa 503 con messaggio chiaro, ogni altro errore 500
 * senza dettagli interni verso il client (il dettaglio resta nei log del server).
 */
export function withStore<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof StoreUnavailableError) return error(e.message, 503);
      console.error(e);
      return error("Errore interno, riprova tra poco", 500);
    }
  };
}
