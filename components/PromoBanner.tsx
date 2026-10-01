"use client";
import { CalendarCheck, Scale, Sparkles } from "lucide-react";
import { formatEur } from "@/lib/pricing";
import { DEFAULT_MARGINS, SEASON_LABEL } from "@/lib/margins";
import { useMargins } from "@/lib/useMargins";
import VIPBookingModal from "@/components/VIPBookingModal";

/** Promozioni attivate dal titolare: compaiono solo se attive, e spariscono appena disattivate. */
export default function PromoBanner() {
  const { settings } = useMargins();
  const { seasonal, heritage, bulk } = { ...DEFAULT_MARGINS.promotions, ...settings.promotions };
  if (!seasonal.active && !heritage.active && !bulk.active) return null;

  return (
    <div className="mb-8 grid gap-3 md:grid-cols-2">
      {seasonal.active && (
        <div className="flex items-center gap-4 border-2 border-gold bg-gold-soft p-5">
          <Sparkles className="size-8 shrink-0 text-gold" strokeWidth={1.5} />
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Promo {SEASON_LABEL[seasonal.season]}</div>
            <div className="mt-1 text-lg font-bold">
              +{formatEur(seasonal.bonusPerGram)}/g sull&apos;oro {seasonal.purityIds.join(", ")}
            </div>
            <div className="text-sm text-muted-foreground">Già incluso nella stima qui sotto. Offerta a tempo limitato.</div>
          </div>
        </div>
      )}
      {bulk.active && (
        <div className="flex items-center gap-4 border-2 border-guarantee bg-guarantee-soft p-5">
          <Scale className="size-8 shrink-0 text-guarantee" strokeWidth={1.5} />
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-guarantee">Bonus lotti</div>
            <div className="mt-1 text-lg font-bold">
              +{formatEur(bulk.bonusPerGram)}/g per lotti d&apos;oro oltre {bulk.minGrams} g
            </div>
            <div className="text-sm text-muted-foreground">Applicato in automatico alla stima quando superi la soglia.</div>
          </div>
        </div>
      )}
      {heritage.active && (
        <div className="flex flex-wrap items-center gap-4 border-2 border-foreground bg-paper p-5">
          <CalendarCheck className="size-8 shrink-0" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em]">Pacchetto Heritage VIP</div>
            <div className="mt-1 text-lg font-bold">
              Oltre {heritage.minGrams} g d&apos;oro: valutazione riservata gratuita + {formatEur(heritage.bonusPerGram)}/g
            </div>
          </div>
          <VIPBookingModal>
            <button type="button" className="h-11 bg-foreground px-5 text-sm font-semibold text-background">
              Prenota
            </button>
          </VIPBookingModal>
        </div>
      )}
    </div>
  );
}
