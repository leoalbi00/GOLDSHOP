"use client";
import { Navigation, Phone } from "lucide-react";
import siteData from "@/data/site-data.json";
import { reopensLabel, useStoreStatus } from "@/lib/useStoreStatus";
import { cn } from "@/lib/cn";

const { address, hours, contacts } = siteData;
const fullAddress = `${address.street}, ${address.cap} ${address.city}`;
const q = encodeURIComponent(fullAddress);
const { lat, lng } = address.coordinates;

/** Google Maps per indirizzo (geocodifica Google), Waze per coordinate del civico: entrambi avviano la navigazione. */
const GOOGLE_NAV = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
const WAZE_NAV = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

export default function DirectLocation() {
  const s = useStoreStatus();

  return (
    <div className="grid overflow-hidden border border-hairline bg-paper lg:grid-cols-5">
      <div className="flex flex-col gap-8 p-6 sm:p-10 lg:col-span-2">
        <div
          aria-live="polite"
          className={cn(
            "flex items-center gap-3 border-2 px-5 py-4 text-lg font-bold uppercase tracking-wide",
            !s ? "border-hairline text-muted-foreground" : s.open ? "border-guarantee bg-guarantee-soft text-guarantee" : "border-rose-700/40 bg-rose-50 text-rose-800",
          )}
        >
          {!s ? (
            "Orari di apertura"
          ) : s.open ? (
            <span>
              🟢 Aperto ora
              <span className="block text-sm font-medium normal-case tracking-normal">Chiude alle {s.closesAt}</span>
            </span>
          ) : (
            <span>
              🔴 Chiuso
              <span className="block text-sm font-medium normal-case tracking-normal">{reopensLabel(s)}</span>
            </span>
          )}
        </div>

        <address className="not-italic">
          <div className="text-3xl font-bold tracking-tight sm:text-4xl">{address.street}</div>
          <div className="mt-1 text-xl text-muted-foreground">
            {address.cap} {address.city} <span className="text-foreground">(Zona Stazione)</span>
          </div>
        </address>

        <div className="grid gap-3">
          <a
            href={GOOGLE_NAV}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-16 items-center justify-center gap-3 bg-foreground text-base font-bold text-background shadow-[0_4px_0_0_#000] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none"
          >
            <Navigation className="size-5" /> Apri su Google Maps
          </a>
          <a
            href={WAZE_NAV}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-16 items-center justify-center gap-3 bg-[#33ccff] text-base font-bold text-foreground shadow-[0_4px_0_0_#1a9fcc] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none"
          >
            <Navigation className="size-5" /> Apri su Waze
          </a>
          <a
            href={`tel:${contacts.phoneIntl}`}
            className="flex h-12 items-center justify-center gap-2 border border-hairline text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Phone className="size-4" /> Chiama {contacts.phone}
          </a>
        </div>

        <dl className="divide-y divide-border border-y border-border text-sm">
          {hours.map((h) => (
            <div key={h.days} className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">{h.days}</dt>
              <dd className="text-right font-medium tabular-nums">{h.hours}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative min-h-[360px] border-t border-border lg:col-span-3 lg:border-l lg:border-t-0">
        <iframe
          title={`Mappa: ${fullAddress}, zona Stazione di Bergamo`}
          src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
