import { SignJWT, jwtVerify } from "jose";

/**
 * Sessione del titolare: JWT HS256 firmato con ADMIN_SESSION_SECRET, in un cookie HttpOnly, Secure, SameSite=Strict.
 * Senza dipendenze Node: lo usano sia il proxy sia le route API.
 */
export const SESSION_COOKIE = "co123_session";
export const SESSION_TTL_S = 8 * 60 * 60;
const ISSUER = "compro-oro-123";
const AUDIENCE = "admin";

const g = globalThis as { __co123Key?: Uint8Array };

/** In sviluppo, senza segreto configurato, una chiave casuale valida finché il server resta acceso. */
function key(): Uint8Array | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret.length >= 32 ? new TextEncoder().encode(secret) : null;
  if (process.env.NODE_ENV === "production") return null;
  return (g.__co123Key ??= crypto.getRandomValues(new Uint8Array(32)));
}

export interface AdminSession {
  sub: string;
}

export async function createSessionToken(username: string): Promise<string | null> {
  const k = key();
  if (!k) return null;
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_S}s`)
    .sign(k);
}

export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  const k = key();
  if (!token || !k) return null;
  try {
    const { payload } = await jwtVerify(token, k, { issuer: ISSUER, audience: AUDIENCE, algorithms: ["HS256"] });
    return payload.role === "owner" && payload.sub ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_S,
};
