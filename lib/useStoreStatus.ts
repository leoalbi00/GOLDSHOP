"use client";
import { useEffect, useState } from "react";
import { storeStatus, type StoreStatus } from "@/lib/store-hours";

/** Stato del negozio aggiornato ogni minuto; null fino al primo render sul client (evita mismatch SSR). */
export function useStoreStatus(): StoreStatus | null {
  const [status, setStatus] = useState<StoreStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(storeStatus());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return status;
}

export function reopensLabel(s: StoreStatus): string {
  if (!s.reopens) return "Chiuso";
  const { when, time } = s.reopens;
  return when === "oggi" ? `Riapre alle ${time}` : `Riapre ${when} alle ${time}`;
}
