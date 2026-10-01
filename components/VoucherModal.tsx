"use client";
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import CryptoJS from "crypto-js";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { X, MapPin, MessageCircle, Clock } from "lucide-react";
import siteData from "@/data/site-data.json";
import type { Purity } from "@/lib/pricing";

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

export default function VoucherModal({ voucher, onClose }: Props) {
  const details = useMemo(() => {
    if (!voucher) return null;
    const code = voucherCode(voucher);
    const expires = dayjs(voucher.issuedAt).add(siteData.pricing.voucherValidityHours, "hour").locale("it");
    const summary =
      `Voucher ${code} - ${siteData.shortName}\n` +
      `${voucher.purity.label} · ${voucher.grams} g · stima ${voucher.amount}\n` +
      `Valido fino al ${expires.format("DD/MM/YYYY HH:mm")}\n` +
      `${siteData.address.street}, ${siteData.address.cap} ${siteData.address.city}`;
    return { code, expires, summary };
  }, [voucher]);

  useEffect(() => {
    if (!voucher) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [voucher, onClose]);

  const waNumber = siteData.contacts.whatsapp.replace(/\D/g, "");

  return (
    <AnimatePresence>
      {voucher && details && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-title"
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-gradient-to-b from-zinc-900 to-black p-6 md:p-8 shadow-2xl shadow-amber-500/20"
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Prezzo bloccato</span>
            <h3 id="voucher-title" className="text-2xl font-serif font-bold text-white mt-1">
              Il tuo voucher di garanzia
            </h3>

            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-amber-500/40 bg-black p-5">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={details.summary} size={176} level="M" />
              </div>
              <div className="mt-4 font-mono text-lg font-bold tracking-widest text-amber-300">{details.code}</div>
              <div className="mt-3 w-full grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-zinc-500">Caratura</div>
                  <div className="font-semibold text-white">{voucher.purity.id}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Peso</div>
                  <div className="font-semibold text-white">{voucher.grams} g</div>
                </div>
                <div>
                  <div className="text-zinc-500">Stima</div>
                  <div className="font-mono font-semibold text-emerald-400">{voucher.amount}</div>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                Valido fino al {details.expires.format("dddd D MMMM, HH:mm")}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                Mostralo in negozio: {siteData.address.street}, {siteData.address.city}
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-zinc-500">
              La stima è confermata previa pesatura su bilancia omologata e verifica della caratura in negozio.
            </p>

            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Buongiorno, ho bloccato questa quotazione online:\n${details.summary}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Invia su WhatsApp
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
