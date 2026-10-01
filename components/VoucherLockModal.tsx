"use client";
import { useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { toast } from "sonner";
import { Check, MessageCircle, Send, ShieldCheck } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import type { Voucher } from "@/lib/vouchers";
import { voucherToCustomerLink, voucherToShopLink } from "@/lib/whatsapp-engine";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Props {
  voucher: Voucher | null;
  onClose: () => void;
}

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const field =
  "h-11 w-full border-b border-hairline bg-transparent px-0 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold";

/** Il cliente lascia nome e cellulare e riceve il voucher su WhatsApp. */
function SendToMyself({ voucher }: { voucher: Voucher }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <p className="mt-5 flex items-center gap-2 text-sm text-guarantee">
        <Check className="size-4" /> Voucher inviato su WhatsApp. Ti ricontatteremo se serve.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Ricevi il voucher su WhatsApp
      </div>
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
      <Button type="submit" variant="guarantee" size="lg" className="w-full rounded-sm" disabled={busy}>
        <Send /> Inviami il voucher
      </Button>
    </form>
  );
}

export default function VoucherLockModal({ voucher, onClose }: Props) {
  return (
    <Dialog open={!!voucher} onOpenChange={(open) => !open && onClose()}>
      {voucher && (
        <DialogContent className="gap-0 rounded-sm sm:max-w-md">
          <DialogHeader className="text-left">
            <Badge variant="outline" className="border-guarantee/30 bg-guarantee-soft text-guarantee">
              <ShieldCheck /> Prezzo bloccato {siteData.pricing.voucherValidityHours}h
            </Badge>
            <DialogTitle className="font-serif text-2xl font-medium">Quotazione bloccata</DialogTitle>
            <DialogDescription>
              Mostra questo QR in negozio, {siteData.address.street}, entro il{" "}
              {dayjs(voucher.expiresAt).locale("it").format("D MMMM [alle] HH:mm")}.
            </DialogDescription>
          </DialogHeader>

          <Card className="mt-5 gap-0 rounded-sm border-hairline py-0 shadow-none">
            <CardContent className="flex flex-col items-center bg-muted px-5 py-6">
              <div className="bg-white p-3 shadow-sm">
                <QRCodeSVG value={voucher.code} size={176} level="M" fgColor="#111827" title={`Voucher ${voucher.code}`} />
              </div>
              <div className="mt-4 font-mono text-base font-semibold tracking-widest">{voucher.code}</div>
            </CardContent>
            <CardFooter className="grid grid-cols-3 divide-x divide-border border-t border-border px-0 text-center text-sm [.border-t]:pt-0">
              <div className="p-3">
                <div className="text-xs text-muted-foreground">Caratura</div>
                <div className="font-medium">{voucher.metal === "silver" ? voucher.purityLabel : voucher.purityId}</div>
              </div>
              <div className="p-3">
                <div className="text-xs text-muted-foreground">Peso</div>
                <div className="font-medium tabular-nums">{gramsFmt.format(voucher.grams)} g</div>
              </div>
              <div className="p-3">
                <div className="text-xs text-muted-foreground">Valore</div>
                <div className="font-semibold tabular-nums text-guarantee">{formatEur(voucher.amountCents / 100)}</div>
              </div>
            </CardFooter>
          </Card>

          <SendToMyself voucher={voucher} />

          <Button asChild variant="outline" size="lg" className="mt-3 w-full rounded-sm">
            <a href={voucherToShopLink(voucher)} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              Scrivi al negozio
            </a>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            La stima è confermata previa pesatura su bilancia omologata e verifica della caratura.
          </p>
        </DialogContent>
      )}
    </Dialog>
  );
}
