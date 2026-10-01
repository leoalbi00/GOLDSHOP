"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Camera, CameraOff, CheckCircle2, Keyboard, Loader2, MessageCircle, Phone, ScanLine } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { formatEur } from "@/lib/pricing";
import { isHotLead, parseVoucherCode, voucherState, type Voucher } from "@/lib/vouchers";
import { volatilityFor } from "@/lib/volatility-alert";
import { priorityMessageLink, telLink } from "@/lib/whatsapp-engine";
import { useQuotes } from "@/lib/useQuotes";
import { VOUCHERS_KEY, apiError } from "@/lib/useAdminData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HotLeadBadge, StateBadge, VolatilityBadge } from "@/components/admin/VoucherBadges";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Apre direttamente la scheda di un voucher (es. dalla lista), senza fotocamera. */
  initialCode?: string | null;
  onCompleted?: (v: Voucher) => void;
}

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

/** Fotocamera posteriore che legge il QR del voucher; si ferma alla prima lettura valida. */
function CameraScanner({ onCode }: { onCode: (code: string) => void }) {
  const id = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode(`qr-${id}`, false);
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            const code = parseVoucherCode(text);
            if (code) onCodeRef.current(code);
          },
          undefined,
        );
      } catch {
        if (!cancelled) setError("Fotocamera non disponibile: consenti l'accesso (serve HTTPS) o inserisci il codice a mano.");
      }
    })();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) void scanner.stop().then(() => scanner?.clear());
    };
  }, [id]);

  return (
    <div className="overflow-hidden border border-hairline bg-foreground">
      <div id={`qr-${id}`} className="aspect-square w-full [&_video]:!h-full [&_video]:object-cover" />
      {error && (
        <p className="flex items-start gap-2 bg-paper p-3 text-xs text-rose-700">
          <CameraOff className="mt-0.5 size-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export default function QRScannerModal({ open, onOpenChange, initialCode, onCompleted }: Props) {
  const { gold24k, silver } = useQuotes();
  const { mutate } = useSWRConfig();
  const [manual, setManual] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<Voucher>(`/api/vouchers/${encodeURIComponent(code)}`);
      setVoucher(data);
      navigator.vibrate?.(60);
    } catch (err) {
      setError(apiError(err, "Voucher non trovato"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setVoucher(null);
      setManual("");
      setError(null);
    } else if (initialCode) {
      void lookup(initialCode);
    }
  }, [open, initialCode, lookup]);

  const complete = async () => {
    if (!voucher) return;
    setCompleting(true);
    try {
      const { data } = await axios.patch<Voucher>(`/api/vouchers/${voucher.code}`, { action: "complete" });
      setVoucher(data);
      await mutate(VOUCHERS_KEY);
      toast.success(`Transazione ${data.code} conclusa`);
      onCompleted?.(data);
    } catch (err) {
      toast.error(apiError(err, "Impossibile concludere la transazione"));
    } finally {
      setCompleting(false);
    }
  };

  const state = voucher ? voucherState(voucher) : null;
  const vol = voucher ? volatilityFor(voucher, gold24k, silver) : null;
  const priority = voucher ? priorityMessageLink(voucher) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block rounded-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-gold" /> Valida voucher
          </DialogTitle>
          <DialogDescription>Inquadra il QR mostrato dal cliente o digita il codice.</DialogDescription>
        </DialogHeader>

        {!voucher && (
          <div className="mt-5 space-y-4">
            {open && !initialCode && !loading && <CameraScanner onCode={lookup} />}
            {loading && (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = parseVoucherCode(manual);
                if (code) void lookup(code);
                else setError("Formato codice non valido (CO123-XXXX-XXXX)");
              }}
              className="flex items-end gap-2"
            >
              <label className="flex-1">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Keyboard className="size-3" /> Codice manuale
                </span>
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value.toUpperCase())}
                  placeholder="CO123-XXXX-XXXX"
                  className="mt-1 h-10 w-full border-b border-foreground bg-transparent font-mono tracking-wider outline-none focus:border-gold"
                />
              </label>
              <button type="submit" className="h-10 bg-foreground px-4 text-sm font-semibold text-background">
                Verifica
              </button>
            </form>
            {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
          </div>
        )}

        {voucher && state && vol && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <StateBadge state={state} />
              {isHotLead(voucher) && <HotLeadBadge />}
              <VolatilityBadge v={vol} />
            </div>
            <div className="mt-3 font-mono text-lg font-semibold tracking-widest">{voucher.code}</div>

            <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
              {[
                ["Caratura", voucher.purityLabel],
                ["Peso bloccato", `${gramsFmt.format(voucher.grams)} g`],
                ["Bloccato il", dayjs(voucher.createdAt).format("DD/MM/YYYY HH:mm")],
                [state === "expired" ? "Scaduto il" : "Valido fino al", dayjs(voucher.expiresAt).format("DD/MM/YYYY HH:mm")],
                ["Cliente", voucher.contact ? `${voucher.contact.name} · ${voucher.contact.phone}` : "Non indicato"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Importo da corrispondere</span>
              <span className="text-3xl font-semibold tabular-nums">{formatEur(voucher.amountCents / 100)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Previa pesatura e verifica del titolo al banco.</p>

            {state === "active" ? (
              <button
                type="button"
                onClick={complete}
                disabled={completing}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 bg-guarantee text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_0_0_#03543d] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
              >
                {completing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Conferma e concludi transazione
              </button>
            ) : (
              <p className="mt-5 border border-hairline bg-muted p-3 text-sm">
                {state === "completed"
                  ? `Transazione già conclusa il ${dayjs(voucher.completedAt).format("DD/MM/YYYY HH:mm")}.`
                  : "Voucher scaduto: applicare la quotazione corrente."}
              </p>
            )}

            {voucher.contact && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <a href={telLink(voucher.contact.phone)} className="inline-flex h-10 items-center justify-center gap-2 border border-hairline hover:bg-muted">
                  <Phone className="size-3.5" /> Chiama
                </a>
                {priority && (
                  <a href={priority} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 border border-hairline hover:bg-muted">
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            )}

            {!initialCode && (
              <button
                type="button"
                onClick={() => setVoucher(null)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Camera className="size-3.5" /> Scansiona un altro voucher
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
