import { NextResponse } from "next/server";
import { referenceQuotes } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * Restituisce le quotazioni €/g per caratura con variazione %.
 * Oggi usa i valori di riferimento in data/site-data.json: per quotazioni
 * in tempo reale, sostituire con la lettura da un feed di mercato (`source: "feed"`).
 */
export async function GET() {
  return NextResponse.json(referenceQuotes(), { headers: { "Cache-Control": "no-store" } });
}
