"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Printer } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import { DEFAULT_MARGINS, SEASON_LABEL } from "@/lib/margins";
import { FLYER } from "@/lib/marketing/spots-data";
import { useMargins } from "@/lib/useMargins";

/** Volantino A5 stampabile: in stampa resta solo il foglio, senza l'interfaccia dell'area riservata. */
export default function Flyer() {
  const { settings } = useMargins();
  const { seasonal, heritage, bulk } = { ...DEFAULT_MARGINS.promotions, ...settings.promotions };
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  useEffect(() => {
    if (!url) setUrl(window.location.origin);
  }, [url]);

  return (
    <div>
      <style>{`@page { size: A5 portrait; margin: 0; } @media print { body { background: #fff !important; } }`}</style>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-serif text-3xl font-medium">Volantino</h1>
          <p className="mt-1 text-sm text-muted-foreground">Formato A5. Le promozioni attive compaiono automaticamente.</p>
        </div>
        <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 bg-foreground px-5 text-sm font-semibold text-background">
          <Printer className="size-4" /> Stampa
        </button>
      </div>

      <article
        className="mx-auto flex aspect-[148/210] w-full max-w-[560px] flex-col border border-hairline bg-[#fffdf7] p-10 text-[#111827] shadow-lg print:max-w-none print:border-0 print:shadow-none"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <div className="flex items-baseline justify-between border-b-2 border-[#111827] pb-3">
          <span className="font-serif text-3xl font-medium">
            Compro Oro <span className="italic text-[#92400e]">123</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92400e]">Bergamo Centro</span>
        </div>

        <h2 className="mt-8 font-serif text-[2.6rem] font-medium leading-[1.02]">{FLYER.headline}</h2>
        <p className="mt-3 text-sm text-[#6b6760]">{FLYER.subhead}</p>

        {(seasonal.active || heritage.active || bulk.active) && (
          <div className="mt-6 space-y-2">
            {seasonal.active && (
              <div className="bg-[#92400e] px-4 py-3 text-white">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Promo {SEASON_LABEL[seasonal.season]}</div>
                <div className="text-lg font-bold">+{formatEur(seasonal.bonusPerGram)} al grammo sull&apos;oro {seasonal.purityIds.join(", ")}</div>
              </div>
            )}
            {bulk.active && (
              <div className="bg-[#047857] px-4 py-3 text-white">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Bonus lotti</div>
                <div className="text-lg font-bold">+{formatEur(bulk.bonusPerGram)} al grammo oltre {bulk.minGrams} g d&apos;oro</div>
              </div>
            )}
            {heritage.active && (
              <div className="border-2 border-[#111827] px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Heritage VIP</div>
                <div className="text-base font-bold">Oltre {heritage.minGrams} g: valutazione riservata + {formatEur(heritage.bonusPerGram)}/g</div>
              </div>
            )}
          </div>
        )}

        <ul className="mt-6 space-y-2 text-sm">
          {FLYER.points.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#047857]" /> {p}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-6 border-t border-[#d9d4c8] pt-5">
          <div className="text-sm">
            <div className="text-xl font-bold">{FLYER.contacts.address}</div>
            <div className="mt-1 text-[#6b6760]">Zona Stazione · Tel. {FLYER.contacts.phone}</div>
            {siteData.hours.map((h) => (
              <div key={h.days} className="text-xs text-[#6b6760]">
                {h.days}: {h.hours}
              </div>
            ))}
          </div>
          {url && (
            <div className="shrink-0 text-center">
              <QRCodeSVG value={url} size={96} level="M" fgColor="#111827" bgColor="#fffdf7" />
              <div className="mt-1 max-w-[110px] text-[9px] leading-tight text-[#6b6760]">{FLYER.cta}</div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
