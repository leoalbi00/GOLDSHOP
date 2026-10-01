import type { NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { credentialsConfigured, verifyCredentials } from "@/lib/auth/credentials";
import { clearLoginFailures, loginLockMinutes, registerFailedLogin } from "@/lib/auth/rate-limit";
import { clientIp, error, json } from "@/lib/server/http";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  if (!credentialsConfigured()) return error("Accesso non configurato sul server", 503);
  const ip = clientIp(req);
  const wait = await loginLockMinutes(ip);
  if (wait) return error(`Troppi tentativi. Riprova tra ${wait} minuti.`, 429);

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  const ok = parsed.success && (await verifyCredentials(parsed.data.username, parsed.data.password));
  if (!ok) {
    const left = await registerFailedLogin(ip);
    return left > 0
      ? error(`Credenziali non valide. Tentativi rimasti: ${left}.`, 401)
      : error("Troppi tentativi. Accesso bloccato per 15 minuti.", 429);
  }

  const token = await createSessionToken(parsed.data.username);
  if (!token) return error("ADMIN_SESSION_SECRET mancante o troppo corto (min. 32 caratteri)", 503);
  await clearLoginFailures(ip);
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}

export async function DELETE() {
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
