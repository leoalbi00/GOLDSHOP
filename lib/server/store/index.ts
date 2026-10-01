import "server-only";
import { neon } from "@neondatabase/serverless";
import { createFileStore } from "@/lib/server/store/file";
import { createPostgresStore, type Sql } from "@/lib/server/store/postgres";
import type { Store } from "@/lib/server/store/types";

export { StoreUnavailableError } from "@/lib/server/store/types";

const g = globalThis as { __co123Store?: Store };

/** URL del database: DATABASE_URL (Neon via Vercel Marketplace) o POSTGRES_URL. */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

/**
 * Postgres (Neon) se è configurato un database; altrimenti file JSON locali.
 * Inizializzazione pigra: nessuna connessione durante la build.
 */
export function getStore(): Store {
  if (g.__co123Store) return g.__co123Store;
  const url = databaseUrl();
  if (url) {
    const client = neon(url);
    const sql: Sql = (text, params = []) => client.query(text, params) as Promise<Record<string, unknown>[]>;
    g.__co123Store = createPostgresStore(sql);
  } else {
    g.__co123Store = createFileStore(!!process.env.VERCEL);
  }
  return g.__co123Store;
}
