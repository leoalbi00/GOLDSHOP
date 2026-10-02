"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import dayjs from "dayjs";
import "dayjs/locale/it";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Check, ChevronDown, Download, Loader2, MessageCircle, Send } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import type { Voucher } from "@/lib/vouchers";
import { lockRequestToShopLink, voucherToCustomerLink } from "@/lib/whatsapp-engine";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  voucher: Voucher | null;
  onClose: () => void;
}

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const GOLD = ["#b8860b", "#d4af37", "#e2c58f", "#f5e6b8", "#92400e"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Pioggia di coriandoli dorati da entrambi i lati; niente animazione con prefers-reduced-motion. */
export function goldConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const shared = { particleCount: 80, spread: 70, startVelocity: 45, ticks: 220, colors: GOLD, zIndex: 100, scalar: 0.9 };
  void confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.75 } });
  void confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.75 } });
  setTimeout(() => void confetti({ ...shared, particleCount: 60, spread: 120, startVelocity: 30, origin: { x: 0.5, y: 0.35 } }), 250);
}

export function useCountdown(expiresAt: string) {
  const [left, setLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(new Date(expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const s = Math.max(0, Math.floor(left / 1000));
  return { expired: s === 0, text: `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` };
}

/**
 * QR come <img>: html2canvas non riproduce il contenuto dei <canvas>, quindi il QR viene disegnato
 * su un canvas nascosto e mostrato come immagine già caricata.
 */
export function QrImage({ value }: { value: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (ref.current) setSrc(ref.current.toDataURL("image/png"));
  }, [value]);
  return (
    <>
      <QRCodeCanvas ref={ref} value={value} size={296} level="M" fgColor="#111827" style={{ display: "none" }} />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={148} height={148} alt={`QR voucher ${value}`} style={{ display: "block" }} />
      ) : (
        <div style={{ width: 148, height: 148 }} />
      )}
    </>
  );
}

/**
 * Certificato del voucher. Usa solo colori esadecimali in stile inline: html2canvas non sa leggere
 * oklch()/color-mix() generati da Tailwind v4, e l'immagine scaricata uscirebbe vuota o con errori.
 */
function Certificate({ voucher, innerRef }: { voucher: Voucher; innerRef: React.Ref<HTMLDivElement> }) {
  const { expired, text } = useCountdown(voucher.expiresAt);
  return (
    <div
      ref={innerRef}
      style={{ background: "#fffdf7", border: "2px solid #b8860b", padding: 6 }}
    >
      {/* Doppia cornice con bordi annidati: html2canvas disegna male le ombre "inset". */}
      <div
        style={{
          // Tinta unita: con un linear-gradient html2canvas dipinge lo sfondo sopra il QR.
          background: "#fcf6e8",
          border: "1px solid #d4af37",
          color: "#111827",
          padding: "22px 18px",
          textAlign: "center",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
        }}
      >
      <div style={{ fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase", color: "#92400e", fontWeight: 600 }}>
        VIP Certificate · {siteData.shortName}
      </div>
      <div style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: 30, fontWeight: 500, marginTop: 6, lineHeight: 1.1 }}>
        Prezzo bloccato
      </div>
      <div style={{ fontSize: 12, color: "#6b6760", marginTop: 4 }}>
        {voucher.purityLabel} · {gramsFmt.format(voucher.grams)} g
      </div>

      <div style={{ fontSize: 40, fontWeight: 700, color: "#047857", marginTop: 14, letterSpacing: "-0.02em" }}>
        {formatEur(voucher.amountCents / 100)}
      </div>

      {/* Blocco centrato, non inline-block: html2canvas dipingerebbe lo sfondo bianco sopra il QR. */}
      <div style={{ display: "block", width: 170, margin: "14px auto 0", background: "#ffffff", padding: 10, border: "1px solid #e6e2d9", boxSizing: "border-box" }}>
        <QrImage value={voucher.code} />
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, letterSpacing: "0.18em", marginTop: 8, fontSize: 14 }}>
        {voucher.code}
      </div>

      <div style={{ marginTop: 16, borderTop: "1px solid #e2c58f", paddingTop: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "#6b6760" }}>
          {expired ? "Voucher scaduto" : "Scade tra"}
        </div>
        <div
          aria-live="off"
          style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: expired ? "#9f1239" : "#92400e", fontVariantNumeric: "tabular-nums" }}
        >
          {text}
        </div>
        <div style={{ fontSize: 11, color: "#6b6760", marginTop: 4 }}>
          {siteData.address.street}, {siteData.address.city} · entro il {dayjs(voucher.expiresAt).locale("it").format("D MMMM, HH:mm")}
        </div>
      </div>
      </div>
    </div>
  );
}

/** Il cliente lascia nome e cellulare e riceve il voucher su WhatsApp. */
export function SendToMyself({ voucher }: { voucher: Voucher }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const field =
    "h-11 w-full border-b border-hairline bg-transparent px-0 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Apertura sincrona: i browser bloccano i popup aperti dopo un await.
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    try {
      await axios.post(`/api/vouchers/${voucher.code}/contact`, { name, phone, consent });
      setSent(true);
      const url = voucherToCustomerLink(phone, voucher);
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (err) {
      win?.close();
      const msg = axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined;
      toast.error(msg ?? "Invio non riuscito, riprova.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <p className="flex items-center gap-2 text-sm text-guarantee">
        <Check className="size-4" /> Voucher inviato su WhatsApp. Ti ricontatteremo se serve.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <input className={field} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="given-name" />
        <input
          className={field}
          placeholder="Cellulare"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^+\d\s]/g, ""))}
          required
          pattern="[+\d\s]{6,20}"
        />
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <input type="checkbox" className="mt-0.5 accent-[#92400e]" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        Acconsento a essere ricontattato da {siteData.shortName} per questo voucher. I dati non sono usati per altri scopi.
      </label>
      <Button type="submit" variant="outline" className="w-full rounded-sm" disabled={busy}>
        <Send /> Inviami il voucher
      </Button>
    </form>
  );
}

export default function VoucherLockModal({ voucher, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (voucher) goldConfetti();
  }, [voucher]);

  const download = async () => {
    if (!certRef.current || !voucher) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#fffdf7", logging: false });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `voucher-${voucher.code}.png`;
      a.click();
    } catch {
      toast.error("Non è stato possibile creare l'immagine. Fai uno screenshot del voucher.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!voucher} onOpenChange={(open) => !open && onClose()}>
      {voucher && (
        <DialogContent className="gap-0 rounded-sm sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Quotazione bloccata</DialogTitle>
            <DialogDescription>Voucher {voucher.code}: mostralo in negozio entro 24 ore.</DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Certificate voucher={voucher} innerRef={certRef} />
          </div>

          <div className="mt-5 grid gap-2">
            <Button asChild size="lg" className="h-14 w-full rounded-sm bg-[#1f9d55] text-base font-bold text-white hover:bg-[#1b8a4b]">
              <a href={lockRequestToShopLink(voucher)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="!size-5" /> Invia al negozio su WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" size="lg" className="h-12 w-full rounded-sm" onClick={download} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Download />} Scarica Ticket Immagine
            </Button>
          </div>

          <details className="group mt-5 border-t border-border pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground">
              Ricevilo anche sul tuo WhatsApp
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4">
              <SendToMyself voucher={voucher} />
            </div>
          </details>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Stima confermata previa pesatura su bilancia omologata e verifica della caratura.
          </p>
        </DialogContent>
      )}
    </Dialog>
  );
}
