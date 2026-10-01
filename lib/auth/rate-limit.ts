import "server-only";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

/**
 * Brute force: 3 tentativi errati per IP, poi blocco di 15 minuti.
 * In più un tetto globale (20 errori in 15 minuti da qualunque IP): l'IP arriva da X-Forwarded-For,
 * che senza un proxy davanti al server può essere falsificato per aggirare il limite per IP.
 * In memoria: vale per singola istanza del server (con più istanze servirebbe un archivio condiviso, es. Redis).
 */
const g = globalThis as { __co123Ip?: RateLimiterMemory; __co123All?: RateLimiterMemory };
const perIp = (g.__co123Ip ??= new RateLimiterMemory({ keyPrefix: "login-ip", points: 3, duration: 15 * 60, blockDuration: 15 * 60 }));
const global = (g.__co123All ??= new RateLimiterMemory({ keyPrefix: "login-all", points: 20, duration: 15 * 60, blockDuration: 15 * 60 }));
const ALL = "all";

const blockedFor = (res: RateLimiterRes | null) =>
  res && res.remainingPoints <= 0 ? Math.max(1, Math.ceil(res.msBeforeNext / 60000)) : 0;

/** Minuti di attesa se l'IP (o l'intero login) è bloccato, altrimenti 0. */
export async function loginLockMinutes(ip: string): Promise<number> {
  return Math.max(blockedFor(await perIp.get(ip)), blockedFor(await global.get(ALL)));
}

/** Registra un errore; restituisce i tentativi rimasti per questo IP. */
export async function registerFailedLogin(ip: string): Promise<number> {
  await global.consume(ALL).catch((e) => {
    if (!(e instanceof RateLimiterRes)) throw e;
  });
  try {
    return (await perIp.consume(ip)).remainingPoints;
  } catch (e) {
    if (e instanceof RateLimiterRes) return 0;
    throw e;
  }
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await perIp.delete(ip);
}
