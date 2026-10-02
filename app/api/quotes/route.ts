import { NextResponse } from "next/server";
import { getLiveQuotes } from "@/lib/server/live-quotes";

export const dynamic = "force-dynamic";

/** Quotazioni €/g per caratura con variazione %: spot da gold-api.com, valori di riferimento come riserva. */
export async function GET() {
  return NextResponse.json(await getLiveQuotes(), { headers: { "Cache-Control": "no-store" } });
}
