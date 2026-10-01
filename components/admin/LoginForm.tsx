"use client";
import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

const field =
  "mt-1 h-12 w-full border-b-2 border-hairline bg-transparent text-base outline-none transition-colors focus:border-foreground";

export default function LoginForm({ devHint }: { devHint: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await axios.post("/api/admin/login", { username, password });
      window.location.assign("/admin");
    } catch (err) {
      setError((axios.isAxiosError<{ error?: string }>(err) && err.response?.data?.error) || "Accesso non riuscito");
      setPassword("");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm border border-hairline bg-paper p-8" autoComplete="on">
      <LockKeyhole className="size-6 text-gold" strokeWidth={1.5} />
      <h1 className="mt-4 font-serif text-3xl font-medium">Accesso riservato</h1>

      <label className="mt-8 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Utente</span>
        <input className={field} name="username" autoComplete="username" required maxLength={64} value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label className="mt-5 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Password o PIN</span>
        <span className="relative block">
          <input
            className={`${field} pr-10`}
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
            aria-label={show ? "Nascondi password" : "Mostra password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
      </label>

      <p className="mt-4 min-h-5 text-sm text-rose-700" role="alert">
        {error}
      </p>
      <button type="submit" disabled={busy} className="mt-2 flex h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background disabled:opacity-50">
        {busy && <Loader2 className="size-4 animate-spin" />} Accedi
      </button>
      {devHint && <p className="mt-6 text-xs text-muted-foreground">Sviluppo: admin / 1234. In produzione servono ADMIN_USERNAME e ADMIN_PASSWORD_HASH.</p>}
    </form>
  );
}
