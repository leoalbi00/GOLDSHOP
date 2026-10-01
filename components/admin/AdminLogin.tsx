"use client";
import { useState } from "react";
import axios from "axios";
import { Delete, Loader2, LockKeyhole } from "lucide-react";
import { apiError } from "@/lib/useAdminData";
import { cn } from "@/lib/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function AdminLogin({ pinLength }: { pinLength: number }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      await axios.post("/api/admin/login", { pin: value });
      window.location.reload();
    } catch (err) {
      setError(apiError(err, "Accesso non riuscito"));
      setPin("");
      setBusy(false);
    }
  };

  const press = (k: string) => {
    if (busy) return;
    if (k === "del") return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, pinLength);
    setPin(next);
    if (next.length === pinLength) void submit(next);
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-4"
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        if (e.key === "Backspace") press("del");
      }}
    >
      <div className="w-full max-w-xs text-center">
        <LockKeyhole className="mx-auto size-6 text-gold" strokeWidth={1.5} />
        <h1 className="mt-4 font-serif text-3xl font-medium">Area riservata</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inserisci il PIN del negozio</p>

        <div className="mt-8 flex justify-center gap-3" aria-live="polite" aria-label={`${pin.length} cifre inserite su ${pinLength}`}>
          {Array.from({ length: pinLength }, (_, i) => (
            <span
              key={i}
              className={cn("size-3 rounded-full border border-foreground transition-colors", i < pin.length && "bg-foreground")}
            />
          ))}
        </div>
        <p className="mt-4 h-5 text-sm text-rose-700" role="alert">
          {busy ? <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" /> : error}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {KEYS.map((k, i) =>
            k === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                autoFocus={i === 0}
                onClick={() => press(k)}
                aria-label={k === "del" ? "Cancella" : k}
                className="flex h-16 items-center justify-center border border-hairline bg-paper text-xl font-medium tabular-nums shadow-[0_2px_0_0_var(--color-hairline)] transition-[transform,box-shadow] active:translate-y-[2px] active:shadow-none"
              >
                {k === "del" ? <Delete className="size-5" /> : k}
              </button>
            ),
          )}
        </div>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 text-xs text-muted-foreground">Ambiente di sviluppo: PIN demo 1234 (imposta ADMIN_PIN in produzione).</p>
        )}
      </div>
    </main>
  );
}
