"use client";
import { Star } from "lucide-react";
import type { Voucher } from "@/lib/vouchers";
import { reviewRequestLink } from "@/lib/whatsapp-engine";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Dopo una transazione conclusa: ringraziamento su WhatsApp con link alla scheda Google del negozio. */
export default function ReviewBooster({ voucher }: { voucher: Voucher }) {
  const href = reviewRequestLink(voucher);
  const cls =
    "inline-flex h-8 items-center gap-1.5 border border-hairline px-2.5 text-xs font-medium whitespace-nowrap transition-colors hover:bg-muted";

  if (!href) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${cls} cursor-not-allowed opacity-40`} tabIndex={0}>
            <Star className="size-3.5" /> Recensione
          </span>
        </TooltipTrigger>
        <TooltipContent>Nessun cellulare: il cliente non l&apos;ha lasciato col voucher.</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      <Star className="size-3.5 text-gold" /> Invia richiesta recensione WhatsApp
    </a>
  );
}
