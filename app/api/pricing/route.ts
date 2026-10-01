import { getStore } from "@/lib/server/store";
import { json, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Spread e promozioni attive: pubblici, perché determinano il prezzo mostrato nel calcolatore. */
export const GET = withStore(async () => json(await getStore().settings.getMargins()));
