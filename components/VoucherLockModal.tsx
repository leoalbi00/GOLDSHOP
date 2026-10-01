"use client";
import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import CryptoJS from "crypto-js";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { MessageCircle } from "lucide-react";
import siteData from "@/data/site-data.json";
import type { Purity } from "@/lib/pricing";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface VoucherData {
  purity: Purity;
  grams: number;
  amount: string;
  issuedAt: Date;
}

interface Props {
  voucher: VoucherData | null;
  onClose: () => void;
}

/** Codice univoco breve derivato da contenuto del voucher + nonce casuale. */
function voucherCode(v: VoucherData): string {
  const nonce = CryptoJS.lib.WordArray.random(8).toString();
  const digest = CryptoJS.SHA256(`${v.purity.id}|${v.grams}|${v.amount}|${v.issuedAt.toISOString()}|${nonce}`)
    .toString()
    .toUpperCase();
  return `CO123-${digest.slice(0, 4)}-${digest.slice(4, 8)}`;
}

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });

export default function VoucherLockModal({ voucher, onClose }: Props) {
  const details = useMemo(() => {
    if (!voucher) return null;
    const code = voucherCode(voucher);
    const expires = dayjs(voucher.issuedAt).add(siteData.pricing.voucherValidityHours, "hour").locale("it");
    const grams = gramsFmt.format(voucher.grams);
    const summary =
      `Voucher ${code} - ${siteData.name}\n` +
      `${voucher.purity.label} · ${grams} g · stima ${voucher.amount}\n` +
      `Valido fino al ${expires.format("DD/MM/YYYY HH:mm")}\n` +
      `${siteData.address.street}, ${siteData.address.cap} ${siteData.address.city}`;
    return { code, expires, grams, summary };
  }, [voucher]);

  const waNumber = siteData.contacts.whatsapp.replace(/\D/g, "");

  return (
    <Dialog open={!!voucher} onOpenChange={(open) => !open && onClose()}>
      {voucher && details && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quotazione bloccata</DialogTitle>
            <DialogDescription>
              Mostra questo codice in negozio, {siteData.address.street}, entro il{" "}
              {details.expires.format("D MMMM [alle] HH:mm")}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col items-center rounded-lg border border-border bg-muted p-5">
            <div className="rounded-md bg-white p-3 shadow-sm">
              <QRCodeSVG value={details.summary} size={168} level="M" fgColor="#0f172a" />
            </div>
            <div className="mt-4 font-mono text-base font-semibold tracking-widest">{details.code}</div>
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-lg border border-border text-center text-sm">
            <div className="p-3">
              <dt className="text-xs text-muted-foreground">Caratura</dt>
              <dd className="font-medium">{voucher.purity.id === "AG" ? "Argento" : voucher.purity.id}</dd>
            </div>
            <div className="p-3">
              <dt className="text-xs text-muted-foreground">Peso</dt>
              <dd className="font-medium tabular-nums">{details.grams} g</dd>
            </div>
            <div className="p-3">
              <dt className="text-xs text-muted-foreground">Stima</dt>
              <dd className="font-semibold tabular-nums text-guarantee">{voucher.amount}</dd>
            </div>
          </dl>

          <Button asChild variant="guarantee" size="lg" className="mt-5 w-full">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Buongiorno, ho bloccato questa quotazione online:\n${details.summary}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Invia su WhatsApp
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
