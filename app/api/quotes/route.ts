import { NextResponse } from "next/server";
import siteData from "@/data/site-data.json";
import { buildQuotes, type QuotesPayload } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * Restituisce le quotazioni €/g per caratura.
 * Oggi usa i valori di riferimento in data/site-data.json: per quotazioni
 * in tempo reale, sostituire `gold24k`/`silver` con la lettura da un feed di mercato.
 */
export async function GET() {
  const { gold24kEurPerGram, silver999EurPerGram, updatedAt } = siteData.pricing;
  const payload: QuotesPayload = {
    updatedAt,
    source: "reference",
    base: { gold24k: gold24kEurPerGram, silver: silver999EurPerGram },
    quotes: buildQuotes(gold24kEurPerGram, silver999EurPerGram),
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
