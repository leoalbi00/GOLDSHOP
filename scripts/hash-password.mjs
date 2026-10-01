// Uso: npm run admin:hash -- "la-tua-password"
// Stampa il valore da impostare in ADMIN_PASSWORD_HASH (base64 dell'hash bcrypt, sicuro nei file .env).
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Indica una password di almeno 10 caratteri: npm run admin:hash -- \"password\"");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log(`ADMIN_PASSWORD_HASH=${Buffer.from(hash).toString("base64")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
