import "server-only";
import bcrypt from "bcryptjs";

/**
 * Credenziali del titolare da variabili d'ambiente:
 * - ADMIN_USERNAME
 * - ADMIN_PASSWORD_HASH: hash bcrypt, anche in base64 (generalo con `npm run admin:hash -- "password"`)
 * In sviluppo, se mancano, valgono admin / 1234. In produzione senza variabili il login è disattivato.
 */
const DEV_USER = "admin";
let devHash: string | null = null;

function decodeHash(raw: string): string {
  // Il base64 evita che i "$" dell'hash bcrypt vengano interpretati nei file .env.
  return raw.startsWith("$2") ? raw : Buffer.from(raw, "base64").toString("utf8");
}

export function credentialsConfigured(): boolean {
  return process.env.NODE_ENV !== "production" || (!!process.env.ADMIN_USERNAME && !!process.env.ADMIN_PASSWORD_HASH);
}

async function expected(): Promise<{ user: string; hash: string } | null> {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH) {
    return { user: process.env.ADMIN_USERNAME, hash: decodeHash(process.env.ADMIN_PASSWORD_HASH) };
  }
  if (process.env.NODE_ENV === "production") return null;
  devHash ??= await bcrypt.hash("1234", 10);
  return { user: DEV_USER, hash: devHash };
}

/** Confronto sempre completo (anche con utente errato) per non rivelare quale campo è sbagliato. */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const exp = await expected();
  if (!exp) return false;
  const passwordOk = await bcrypt.compare(password, exp.hash);
  const userOk = username.trim().toLowerCase() === exp.user.trim().toLowerCase();
  return passwordOk && userOk;
}
