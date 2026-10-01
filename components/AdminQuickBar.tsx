"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Delete, ExternalLink, KeyRound, Loader2, LogOut, Minus, Plus, X } from "lucide-react";
import { PURITIES, formatEur, offerPerGram } from "@/lib/pricing";
import { spreadFor, type MarginSettings } from "@/lib/margins";
import { useQuotes } from "@/lib/useQuotes";
import { MARGINS_KEY, useMargins } from "@/lib/useMargins";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

const apiError = (err: unknown, fallback: string) =>
  (axios.isAxiosError<{ error?: string }>(err) && err.response?.data?.error) || fallback;

/** Passo di modifica: 0,50 €/g per l'oro, 0,05 €/g per l'argento (che vale meno di 1 €/g). */
const stepFor = (metal: string) => (metal === "gold" ? 0.5 : 0.05);
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

function PinPad({ length, onSuccess }: { length: number; onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const press = async (k: string) => {
    if (busy) return;
    if (k === "del") return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, length);
    setPin(next);
    if (next.length < length) return;
    setBusy(true);
    setError(null);
    try {
      // Il PIN è verificato dal server, che imposta la sessione: nessun PIN nel codice della pagina.
      await axios.post("/api/admin/login", { pin: next });
      onSuccess();
    } catch (err) {
      setError(apiError(err, "PIN errato"));
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) void press(e.key);
        if (e.key === "Backspace") void press("del");
      }}
    >
      <div className="flex justify-center gap-3" aria-label={`${pin.length} cifre su ${length}`} aria-live="polite">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={cn("size-3 rounded-full border border-foreground", i < pin.length && "bg-foreground")} />
        ))}
      </div>
      <p className="mt-3 h-5 text-center text-sm text-rose-700" role="alert">
        {busy ? <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" /> : error}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              autoFocus={i === 0}
              onClick={() => void press(k)}
              aria-label={k === "del" ? "Cancella" : k}
              className="flex h-14 items-center justify-center border border-hairline bg-paper text-xl font-medium tabular-nums active:translate-y-px"
            >
              {k === "del" ? <Delete className="size-5" /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/** Barra flottante del titolare: spread al grammo modificabile al volo dal telefono. */
function SpreadBar({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const { gold24k, silver } = useQuotes();
  const { settings, mutate } = useMargins();
  const [purityId, setPurityId] = useState("18K");
  const [saving, setSaving] = useState(false);
  const purity = PURITIES.find((p) => p.id === purityId)!;
  const spread = spreadFor(settings, purityId);
  const step = stepFor(purity.metal);

  const change = async (delta: number) => {
    const next = Math.max(0, Math.round((spread + delta) * 100) / 100);
    if (next === spread) return;
    setSaving(true);
    try {
      const { data } = await axios.put<MarginSettings>(MARGINS_KEY, { spreads: { [purityId]: next } });
      // Il calcolatore della pagina legge la stessa cache: il prezzo cambia subito sotto gli occhi.
      await mutate(data, { revalidate: false });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) onLogout();
      toast.error(apiError(err, "Spread non salvato"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Barra rapida del titolare"
      className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-2xl border border-white/10 bg-foreground p-3 text-background shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] sm:inset-x-4 sm:bottom-4 sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2c58f]">Titolare · spread al grammo</div>
        <div className="flex items-center gap-1">
          <a href="/admin" className="inline-flex size-8 items-center justify-center text-background/70 hover:text-background" aria-label="Apri dashboard completa">
            <ExternalLink className="size-4" />
          </a>
          <button type="button" onClick={onLogout} className="inline-flex size-8 items-center justify-center text-background/70 hover:text-background" aria-label="Esci">
            <LogOut className="size-4" />
          </button>
          <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center text-background/70 hover:text-background" aria-label="Nascondi barra">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex gap-1 overflow-x-auto" role="radiogroup" aria-label="Caratura">
        {PURITIES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === purityId}
            onClick={() => setPurityId(p.id)}
            className={cn(
              "h-8 shrink-0 px-3 text-xs font-semibold transition-colors",
              p.id === purityId ? "bg-[#e2c58f] text-foreground" : "bg-white/10 text-background hover:bg-white/20",
            )}
          >
            {p.metal === "silver" ? (p.id === "AG" ? "Ag 999" : "Ag 925") : p.id}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void change(-step)}
          disabled={saving || spread <= 0}
          aria-label={`Riduci spread di ${formatEur(step)}`}
          className="flex size-14 shrink-0 items-center justify-center bg-white/10 transition-colors hover:bg-white/20 active:translate-y-px disabled:opacity-30"
        >
          <Minus className="size-6" />
        </button>
        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <div className="text-2xl font-bold tabular-nums">
            −{formatEur(spread)}
            <span className="text-sm font-normal text-background/60">/g</span>
            {saving && <Loader2 className="ml-2 inline size-4 animate-spin" />}
          </div>
          <div className="text-xs text-background/60">
            Cliente riceve {formatEur(offerPerGram(purity, gold24k, silver, spread).toNumber())}/g · passo {formatEur(step)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void change(step)}
          disabled={saving}
          aria-label={`Aumenta spread di ${formatEur(step)}`}
          className="flex size-14 shrink-0 items-center justify-center bg-white/10 transition-colors hover:bg-white/20 active:translate-y-px disabled:opacity-30"
        >
          <Plus className="size-6" />
        </button>
      </div>
    </div>
  );
}

/** Ingresso discreto nel footer: PIN verificato dal server, poi barra flottante per gli spread. */
export default function AdminQuickBar() {
  const [admin, setAdmin] = useState(false);
  const [pinLength, setPinLength] = useState(4);
  const [pinOpen, setPinOpen] = useState(false);
  const [barOpen, setBarOpen] = useState(false);

  useEffect(() => {
    axios
      .get<{ admin: boolean; pinLength: number }>("/api/admin/login")
      .then(({ data }) => {
        setAdmin(data.admin);
        setPinLength(data.pinLength);
      })
      .catch(() => undefined);
  }, []);

  const logout = async () => {
    await axios.delete("/api/admin/login").catch(() => undefined);
    setAdmin(false);
    setBarOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (admin ? setBarOpen(true) : setPinOpen(true))}
        className="inline-flex items-center gap-1.5 text-xs text-background/40 transition-colors hover:text-background/80"
      >
        <KeyRound className="size-3" /> Area titolare
      </button>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="block rounded-sm sm:max-w-xs">
          <DialogHeader className="text-center">
            <DialogTitle className="font-serif text-2xl font-medium">Area titolare</DialogTitle>
            <DialogDescription>Inserisci il PIN del negozio</DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <PinPad
              length={pinLength}
              onSuccess={() => {
                setAdmin(true);
                setPinOpen(false);
                setBarOpen(true);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {admin && barOpen && <SpreadBar onClose={() => setBarOpen(false)} onLogout={logout} />}
    </>
  );
}
