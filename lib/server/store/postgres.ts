import type { Booking } from "@/lib/bookings";
import { DEFAULT_MARGINS, type MarginSettings } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { LOGIN_LIMITS, withMarginDefaults, type CompleteResult, type Store } from "@/lib/server/store/types";

/** Esecutore SQL minimo: testo con $1, $2… e parametri; restituisce le righe. */
export type Sql = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS vouchers (
     code text PRIMARY KEY,
     created_at timestamptz NOT NULL,
     data jsonb NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS vouchers_created_idx ON vouchers (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS bookings (
     id text PRIMARY KEY,
     slot_date text NOT NULL CHECK (slot_date ~ '^\\d{4}-\\d{2}-\\d{2}$'),
     slot_time text NOT NULL CHECK (slot_time ~ '^\\d{2}:\\d{2}$'),
     status text NOT NULL,
     data jsonb NOT NULL
   )`,
  // Una sola prenotazione non annullata per fascia: il database impedisce le doppie prenotazioni.
  `CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_active ON bookings (slot_date, slot_time) WHERE status <> 'cancelled'`,
  `CREATE TABLE IF NOT EXISTS settings (
     key text PRIMARY KEY,
     value jsonb NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS login_failures (
     key text PRIMARY KEY,
     count integer NOT NULL,
     reset_at timestamptz NOT NULL
   )`,
];

const isUniqueViolation = (e: unknown) => (e as { code?: string } | null)?.code === "23505";

/** jsonb può arrivare già decodificato (driver) o come stringa. */
const json = <T>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;

function toBooking(row: Record<string, unknown>): Booking {
  return { ...json<Booking>(row.data), date: String(row.slot_date), time: String(row.slot_time), status: row.status as Booking["status"] };
}

export function createPostgresStore(sql: Sql): Store {
  let ready: Promise<void> | null = null;
  /** Crea le tabelle al primo uso (idempotente): nessuna migrazione manuale da lanciare. */
  const init = () =>
    (ready ??= (async () => {
      for (const statement of SCHEMA) await sql(statement);
    })().catch((e) => {
      ready = null;
      throw e;
    }));
  const q: Sql = async (text, params) => {
    await init();
    return sql(text, params);
  };

  const failKey = async (key: string, limit: number) => {
    const [row] = await q(
      `INSERT INTO login_failures AS f (key, count, reset_at)
       VALUES ($1, 1, now() + make_interval(secs => $3))
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN f.reset_at <= now() THEN 1 ELSE f.count + 1 END,
         reset_at = CASE
           WHEN f.reset_at <= now() THEN now() + make_interval(secs => $3)
           WHEN f.count + 1 >= $2 THEN now() + make_interval(secs => $3)
           ELSE f.reset_at END
       RETURNING count`,
      [key, limit, LOGIN_LIMITS.windowS],
    );
    return Number(row.count);
  };

  return {
    vouchers: {
      async list() {
        const rows = await q(`SELECT data FROM vouchers ORDER BY created_at DESC`);
        return rows.map((r) => json<Voucher>(r.data));
      },
      async get(code) {
        const [row] = await q(`SELECT data FROM vouchers WHERE code = $1`, [code]);
        return row ? json<Voucher>(row.data) : null;
      },
      async insert(v) {
        await q(`INSERT INTO vouchers (code, created_at, data) VALUES ($1, $2, $3::jsonb)`, [v.code, v.createdAt, JSON.stringify(v)]);
      },
      async complete(code, now): Promise<CompleteResult> {
        // Condizione e aggiornamento nella stessa istruzione: due scansioni simultanee non lo concludono due volte.
        const [row] = await q(
          `UPDATE vouchers
           SET data = data || jsonb_build_object('status', 'completed', 'completedAt', $2::text)
           WHERE code = $1 AND data->>'status' = 'active' AND (data->>'expiresAt')::timestamptz > $3::timestamptz
           RETURNING data`,
          [code, now.toISOString(), now.toISOString()],
        );
        if (row) return { ok: true, voucher: json<Voucher>(row.data) };
        const current = await this.get(code);
        if (!current) return { ok: false, reason: "not_found" };
        return { ok: false, reason: current.status === "completed" ? "completed" : "expired" };
      },
      async setContact(code, contact, now) {
        const rows = await q(
          `UPDATE vouchers SET data = jsonb_set(data, '{contact}', $2::jsonb)
           WHERE code = $1 AND data->>'status' = 'active' AND (data->>'expiresAt')::timestamptz > $3::timestamptz
           RETURNING code`,
          [code, JSON.stringify(contact), now.toISOString()],
        );
        return rows.length > 0;
      },
      async setOam(code, oam) {
        const [row] = await q(`UPDATE vouchers SET data = jsonb_set(data, '{oam}', $2::jsonb) WHERE code = $1 RETURNING data`, [
          code,
          JSON.stringify(oam),
        ]);
        return row ? json<Voucher>(row.data) : null;
      },
    },

    bookings: {
      async list() {
        const rows = await q(`SELECT slot_date, slot_time, status, data FROM bookings ORDER BY slot_date, slot_time`);
        return rows.map(toBooking);
      },
      async takenSlots(fromDate) {
        const rows = await q(`SELECT slot_date, slot_time FROM bookings WHERE status <> 'cancelled' AND slot_date >= $1`, [fromDate]);
        return new Set(rows.map((r) => `${r.slot_date} ${r.slot_time}`));
      },
      async insert(b) {
        const rows = await q(
          `INSERT INTO bookings (id, slot_date, slot_time, status, data) VALUES ($1, $2, $3, $4, $5::jsonb)
           ON CONFLICT DO NOTHING RETURNING id`,
          [b.id, b.date, b.time, b.status, JSON.stringify(b)],
        );
        return rows.length > 0;
      },
      async setStatus(id, status) {
        const [row] = await q(
          `UPDATE bookings SET status = $2, data = data || jsonb_build_object('status', $2::text)
           WHERE id = $1 RETURNING slot_date, slot_time, status, data`,
          [id, status],
        );
        return row ? toBooking(row) : null;
      },
      async reschedule(id, date, time) {
        try {
          // Uno spostamento va riconfermato al cliente: torna "da confermare".
          const [row] = await q(
            `UPDATE bookings SET slot_date = $2, slot_time = $3, status = 'requested',
               data = data || jsonb_build_object('date', $2::text, 'time', $3::text, 'status', 'requested')
             WHERE id = $1 AND status <> 'cancelled' RETURNING slot_date, slot_time, status, data`,
            [id, date, time],
          );
          return row ? toBooking(row) : "not_found";
        } catch (e) {
          if (isUniqueViolation(e)) return "taken";
          throw e;
        }
      },
    },

    settings: {
      async getMargins() {
        const [row] = await q(`SELECT value FROM settings WHERE key = 'margins'`);
        return withMarginDefaults(row ? json<MarginSettings>(row.value) : null, DEFAULT_MARGINS);
      },
      async updateMargins(fn) {
        const next = fn(await this.getMargins());
        await q(
          `INSERT INTO settings (key, value, updated_at) VALUES ('margins', $1::jsonb, now())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [JSON.stringify(next)],
        );
        return next;
      },
    },

    limiter: {
      async lockMinutes(ip) {
        const rows = await q(
          `SELECT key, count, ceil(extract(epoch FROM (reset_at - now())) / 60) AS minutes
           FROM login_failures WHERE key = ANY($1) AND reset_at > now()`,
          [[`ip:${ip}`, "all"]],
        );
        let minutes = 0;
        for (const r of rows) {
          const limit = r.key === "all" ? LOGIN_LIMITS.global : LOGIN_LIMITS.perIp;
          if (Number(r.count) >= limit) minutes = Math.max(minutes, Math.max(1, Number(r.minutes)));
        }
        return minutes;
      },
      async fail(ip) {
        await failKey("all", LOGIN_LIMITS.global);
        return Math.max(0, LOGIN_LIMITS.perIp - (await failKey(`ip:${ip}`, LOGIN_LIMITS.perIp)));
      },
      async clear(ip) {
        await q(`DELETE FROM login_failures WHERE key = $1`, [`ip:${ip}`]);
      },
    },
  };
}
