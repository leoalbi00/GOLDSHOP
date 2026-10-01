import { NextResponse, type NextRequest } from "next/server";
import siteData from "@/data/site-data.json";
import { demoHistory, TIMEFRAMES, type HistoryPayload, type Timeframe } from "@/lib/history";

export const dynamic = "force-dynamic";

/**
 * Storico prezzo oro 24K (€/g) per timeframe.
 * Oggi restituisce una serie dimostrativa (`source: "demo"`): collegare qui
 * un feed di mercato reale e impostare `source: "feed"`.
 */
export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("range");
  const timeframe: Timeframe = TIMEFRAMES.some((t) => t.id === param) ? (param as Timeframe) : "30d";
  const { gold24kEurPerGram, updatedAt } = siteData.pricing;
  const payload: HistoryPayload = {
    timeframe,
    source: "demo",
    points: demoHistory(timeframe, gold24kEurPerGram, updatedAt),
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
