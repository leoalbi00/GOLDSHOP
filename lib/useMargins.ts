"use client";
import useSWR from "swr";
import axios from "axios";
import { DEFAULT_MARGINS, type MarginSettings } from "@/lib/margins";

const fetcher = (url: string) => axios.get<MarginSettings>(url).then((r) => r.data);

export const MARGINS_KEY = "/api/admin/config";

/** Spread decisi dal titolare: il calcolatore pubblico li rilegge al focus e ogni minuto. */
export function useMargins() {
  const { data, mutate } = useSWR(MARGINS_KEY, fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    fallbackData: DEFAULT_MARGINS,
  });
  return { settings: data ?? DEFAULT_MARGINS, mutate };
}
