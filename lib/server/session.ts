import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "co123_admin";
const SESSION_TTL_S = 12 * 60 * 60;

const g = globalThis as { __co123Secret?: string };

/** Senza ADMIN_SESSION_SECRET le sessioni valgono finché il server resta acceso. */
function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? (g.__co123Secret ??= randomBytes(32).toString("hex"));
}

/** PIN da ADMIN_PIN; il PIN demo 1234 vale solo fuori produzione. */
export function adminPin(): string | null {
  return process.env.ADMIN_PIN ?? (process.env.NODE_ENV === "production" ? null : "1234");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPin(pin: string): boolean {
  const expected = adminPin();
  return expected !== null && safeEqual(sign(`pin:${pin}`), sign(`pin:${expected}`));
}

export function createSessionToken(): { token: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  return { token: `${exp}.${sign(`session:${exp}`)}`, maxAge: SESSION_TTL_S };
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(mac, sign(`session:${exp}`));
}

export async function isAdmin(): Promise<boolean> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Limite tentativi PIN per IP: 5 errori bloccano per 15 minuti. */
const attempts = new Map<string, { fails: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export function loginBlocked(ip: string): number {
  const a = attempts.get(ip);
  return a && a.until > Date.now() ? Math.ceil((a.until - Date.now()) / 60000) : 0;
}

export function recordLogin(ip: string, ok: boolean) {
  if (ok) return void attempts.delete(ip);
  const a = attempts.get(ip) ?? { fails: 0, until: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.fails = 0;
    a.until = Date.now() + LOCK_MS;
  }
  attempts.set(ip, a);
}
