import "server-only";
import { getStore } from "@/lib/server/store";

/**
 * Brute force: 3 tentativi errati per IP, poi blocco di 15 minuti, più un tetto globale di 20 errori in 15 minuti
 * (l'IP arriva da X-Forwarded-For, falsificabile senza un proxy davanti al server).
 * Con il database i contatori sono condivisi tra tutte le istanze; in locale restano in memoria.
 */
export const loginLockMinutes = (ip: string) => getStore().limiter.lockMinutes(ip);
export const registerFailedLogin = (ip: string) => getStore().limiter.fail(ip);
export const clearLoginFailures = (ip: string) => getStore().limiter.clear(ip);
