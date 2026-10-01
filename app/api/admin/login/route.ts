import type { NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, adminPin, checkPin, createSessionToken, loginBlocked, recordLogin } from "@/lib/server/session";
import { clientIp, error, json } from "@/lib/server/http";

export async function POST(req: NextRequest) {
  if (adminPin() === null) return error("ADMIN_PIN non configurato sul server", 503);
  const ip = clientIp(req);
  const wait = loginBlocked(ip);
  if (wait) return error(`Troppi tentativi. Riprova tra ${wait} minuti.`, 429);

  const body = z.object({ pin: z.string().regex(/^\d{4,8}$/) }).safeParse(await req.json().catch(() => null));
  const ok = body.success && checkPin(body.data.pin);
  recordLogin(ip, ok);
  if (!ok) return error("PIN errato", 401);

  const { token, maxAge } = createSessionToken();
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
