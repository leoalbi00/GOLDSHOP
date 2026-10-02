"use client";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { toast } from "sonner";
import { ChevronDown, Download, Loader2, MessageCircle } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import { VIP_LABEL } from "@/lib/margins";
import type { Voucher } from "@/lib/vouchers";
import { lockRequestToShopLink } from "@/lib/whatsapp-engine";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrImage, SendToMyself, goldConfetti, useCountdown } from "@/components/VoucherLockModal";

interface Props {
  voucher: Voucher | null;
  onClose: () => void;
}

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const { address, visitPerks, shortName } = siteData;

/** Palette del pass: solo esadecimali inline, perché html2canvas non legge oklch()/color-mix() di Tailwind v4. */
const C = {
  bg: "#111827",
  panel: "#1b2333",
  gold: "#e2c58f",
  goldDeep: "#b8925a",
  text: "#faf9f6",
  dim: "#9ca3af",
  green: "#6ee7b7",
  rose: "#fda4af",
  page: "#faf9f6",
};

const label: React.CSSProperties = { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.dim, fontWeight: 600 };

function Field({ title, children, align = "left" }: { title: string; children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={label}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, color: C.text }}>{children}</div>
    </div>
  );
}

/** Pass in stile Wallet: intestazione, importo bloccato, campi, perforazione, vantaggi in sede e QR. */
function Pass({ voucher, innerRef }: { voucher: Voucher; innerRef: React.Ref<HTMLDivElement> }) {
  const { expired, text } = useCountdown(voucher.expiresAt);
  const level = voucher.vipLevel && voucher.vipLevel !== "standard" ? voucher.vipLevel : null;
  const notch: React.CSSProperties = { position: "absolute", top: -11, width: 22, height: 22, borderRadius: 11, background: C.page };

  return (
    <div ref={innerRef} style={{ background: C.page, padding: 2 }}>
      <div
        style={{
          background: C.bg,
          color: C.text,
          borderRadius: 18,
          overflow: "hidden",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          border: `1px solid ${C.goldDeep}`,
        }}
      >
        {/* Intestazione */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <div style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: 24, fontWeight: 500 }}>
            123 <span style={{ fontStyle: "italic", color: C.gold }}>Gold</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={label}>{level ? "VIP Pass" : "Voucher"}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginTop: 2 }}>
              {level === "vip" ? "👑 " : level === "bonus" ? "🔥 " : ""}
              {level ? VIP_LABEL[level] : "Prezzo bloccato"}
            </div>
          </div>
        </div>

        {/* Importo */}
        <div style={{ background: C.panel, padding: "18px 20px", borderTop: `1px solid ${C.goldDeep}`, borderBottom: `1px solid ${C.goldDeep}` }}>
          <div style={label}>Netto bloccato</div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", color: C.gold, lineHeight: 1.1, marginTop: 4 }}>
            {formatEur(voucher.amountCents / 100)}
          </div>
        </div>

        {/* Campi */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "16px 20px" }}>
          <Field title="Oro bloccato">
            {voucher.purityLabel} · {gramsFmt.format(voucher.grams)} g
          </Field>
          <Field title="Bonus applicato" align="right">
            {voucher.vipBonusPerGram ? (
              <span style={{ color: C.green }}>+{formatEur(voucher.vipBonusPerGram)}/g</span>
            ) : (
              "Standard garantita"
            )}
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "0 20px 16px" }}>
          <Field title={expired ? "Voucher scaduto" : "Scade tra"}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums", color: expired ? C.rose : C.text }}>
              {text}
            </span>
          </Field>
          <Field title="Valido fino al" align="right">
            {dayjs(voucher.expiresAt).locale("it").format("D MMM, HH:mm")}
          </Field>
        </div>

        {/* Perforazione */}
        <div style={{ position: "relative", height: 0, borderTop: `2px dashed ${C.goldDeep}`, margin: "0 18px" }}>
          <div style={{ ...notch, left: -30 }} />
          <div style={{ ...notch, right: -30 }} />
        </div>

        {/* Vantaggi in sede */}
        <div style={{ padding: "16px 20px 4px" }}>
          <div style={label}>Inclusi presentando il pass</div>
          {visitPerks.voucherBadges.map((b) => (
            <div
              key={b.label}
              style={{
                marginTop: 8,
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${C.goldDeep}`,
                background: C.panel,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {b.icon} {b.label}
            </div>
          ))}
        </div>

        {/* QR */}
        <div style={{ padding: "16px 20px 20px", textAlign: "center" }}>
          {/* Blocco centrato, non inline-block: html2canvas dipingerebbe lo sfondo sopra il QR. */}
          <div style={{ display: "block", width: 170, margin: "0 auto", background: "#ffffff", padding: 11, borderRadius: 12, boxSizing: "border-box" }}>
            <QrImage value={voucher.code} />
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, letterSpacing: "0.18em", marginTop: 10, fontSize: 14 }}>
            {voucher.code}
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>
            {address.street}, {address.city} · {shortName}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoucherModal({ voucher, onClose }: Props) {
  const passRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (voucher) goldConfetti();
  }, [voucher]);

  const save = async () => {
    if (!passRef.current || !voucher) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(passRef.current, { scale: 2, backgroundColor: C.page, logging: false });
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
        <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto rounded-2xl sm:max-w-md" data-lenis-prevent>
          <DialogHeader className="sr-only">
            <DialogTitle>Voucher VIP sbloccato</DialogTitle>
            <DialogDescription>
              Voucher {voucher.code}: mostralo in negozio entro {siteData.pricing.voucherValidityHours} ore.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Pass voucher={voucher} innerRef={passRef} />
          </div>

          <div className="mt-5 grid gap-2">
            <Button asChild size="lg" className="h-14 w-full rounded-xl bg-[#1f9d55] text-base font-bold text-white hover:bg-[#1b8a4b]">
              <a href={lockRequestToShopLink(voucher)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="!size-5" /> Invia subito su WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" size="lg" className="h-12 w-full rounded-xl" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Download />} Salva Immagine
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
            Importo confermato previa pesatura su bilancia omologata e verifica della caratura.
          </p>
        </DialogContent>
      )}
    </Dialog>
  );
}
