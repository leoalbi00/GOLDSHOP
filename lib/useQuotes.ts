"use client";
import useSWR from "swr";
import axios from "axios";
import { referenceQuotes, type QuotesPayload } from "@/lib/pricing";

const fetcher = (url: string) => axios.get<QuotesPayload>(url).then((r) => r.data);

const fallback = referenceQuotes();

export function useQuotes() {
  const { data } = useSWR("/api/quotes", fetcher, {
    refreshInterval: 60_000,
    fallbackData: fallback,
  });
  const payload = data ?? fallback;
  return { ...payload, gold24k: payload.base.gold24k, silver: payload.base.silver };
}
