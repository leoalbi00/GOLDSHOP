"use client";
import useSWR from "swr";
import axios from "axios";
import siteData from "@/data/site-data.json";
import { buildQuotes, type QuotesPayload } from "@/lib/pricing";

const fetcher = (url: string) => axios.get<QuotesPayload>(url).then((r) => r.data);

const fallback: QuotesPayload = {
  updatedAt: siteData.pricing.updatedAt,
  source: "reference",
  base: { gold24k: siteData.pricing.gold24kEurPerGram, silver: siteData.pricing.silver999EurPerGram },
  quotes: buildQuotes(siteData.pricing.gold24kEurPerGram, siteData.pricing.silver999EurPerGram),
};

export function useQuotes() {
  const { data } = useSWR("/api/quotes", fetcher, {
    refreshInterval: 60_000,
    fallbackData: fallback,
  });
  const payload = data ?? fallback;
  return { ...payload, gold24k: payload.base.gold24k, silver: payload.base.silver };
}
