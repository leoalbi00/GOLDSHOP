import { DEFAULT_MARGINS, type MarginSettings } from "@/lib/margins";
import { marginStore } from "@/lib/server/repos";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Spread e promozioni attive: pubblici, perché determinano il prezzo mostrato nel calcolatore. */
export async function GET() {
  const s = await marginStore.read();
  const data: MarginSettings = { ...s, promotions: { ...DEFAULT_MARGINS.promotions, ...s.promotions } };
  return json(data);
}
