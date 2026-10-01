"use client";
import useSWR from "swr";
import axios from "axios";
import type { Voucher } from "@/lib/vouchers";
import type { Booking } from "@/lib/bookings";

/** Su 401 (sessione scaduta) ricarica la pagina: il layout mostra di nuovo il PIN. */
async function fetcher<T>(url: string): Promise<T> {
  try {
    return (await axios.get<T>(url)).data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) window.location.reload();
    throw e;
  }
}

export const VOUCHERS_KEY = "/api/vouchers";
export const BOOKINGS_KEY = "/api/bookings";

export function useVouchers() {
  return useSWR<Voucher[]>(VOUCHERS_KEY, fetcher, { refreshInterval: 15_000 });
}

export function useBookings() {
  return useSWR<Booking[]>(BOOKINGS_KEY, fetcher, { refreshInterval: 30_000 });
}

export function apiError(err: unknown, fallback: string): string {
  return (axios.isAxiosError<{ error?: string }>(err) && err.response?.data?.error) || fallback;
}
