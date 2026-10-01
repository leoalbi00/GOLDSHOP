"use client";
import { Phone } from "lucide-react";
import siteData from "@/data/site-data.json";
import { reopensLabel, useStoreStatus } from "@/lib/useStoreStatus";
import DistanceCalculator from "@/components/DistanceCalculator";
import VIPBookingModal from "@/components/VIPBookingModal";
import { cn } from "@/lib/cn";

const { address, hours, contacts } = siteData;
const fullAddress = `${address.street}, ${address.cap} ${address.city}`;
const q = encodeURIComponent(fullAddress);
const { lat, lng } = address.coordinates;

/** Google Maps per indirizzo (geocodifica Google), Waze per coordinate del civico: entrambi avviano la navigazione. */
const GOOGLE_NAV = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
const WAZE_NAV = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

/** Cornice "oro satinato": bordo a gradiente con un sottile riflesso. */
const goldFrame = "bg-gradient-to-br from-[#e2c58f] via-[#b8925a] to-[#e9d6ad] p-px";
const glass = "bg-[#fffdf7]/85 backdrop-blur-md";

function LiveStatus() {
  const s = useStoreStatus();
  return (
    <div aria-live="polite">
      <span className={cn("text-sm font-semibold", s?.open ? "text-guarantee" : "text-rose-800")}>
        {!s ? (
          "Orari di apertura"
        ) : s.open ? (
          <>
            🟢 <span className="uppercase tracking-[0.16em]">Aperto ora</span> — {address.street}, Bergamo (vicino alla Stazione)
            <span className="block font-normal text-muted-foreground">Fino alle {s.closesAt}</span>
          </>
        ) : (
          <>
            🔴 <span className="uppercase tracking-[0.16em]">Chiuso</span> — {reopensLabel(s)}
            <span className="block font-normal text-muted-foreground">Intanto puoi bloccare il prezzo online</span>
          </>
        )}
      </span>
    </div>
  );
}

export default function LuxuryLocation() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="border border-amber-500/20 shadow-[0_24px_48px_-32px_rgba(146,64,14,0.35)] lg:col-span-5">
        <div className={cn(glass, "flex h-full flex-col gap-8 p-7 sm:p-10")}>
          <LiveStatus />

          <address className="not-italic">
            <div className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{address.street}</div>
            <div className="mt-2 font-serif text-xl italic text-muted-foreground">
              {address.cap} {address.city} · zona Stazione
            </div>
          </address>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={GOOGLE_NAV}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center gap-2 bg-foreground text-sm font-semibold tracking-wide text-[#f5e6b8] ring-1 ring-[#b8925a]/60 transition-colors hover:bg-[#1f2937]"
            >
              <span aria-hidden>🗺️</span> Apri in Google Maps
            </a>
            <a
              href={WAZE_NAV}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center gap-2 bg-foreground text-sm font-semibold tracking-wide text-[#f5e6b8] ring-1 ring-[#b8925a]/60 transition-colors hover:bg-[#1f2937]"
            >
              <span aria-hidden>🚘</span> Avvia Waze
            </a>
            <a
              href={`tel:${contacts.phoneIntl}`}
              className="col-span-2 flex h-12 items-center justify-center gap-2 border border-[#b8925a]/60 text-sm font-semibold transition-colors hover:bg-[#f5e6b8]/40"
            >
              <Phone className="size-4 text-gold" /> {contacts.phone}
            </a>
          </div>

          <DistanceCalculator />

          <dl className="divide-y divide-[#e2c58f]/60 border-y border-[#e2c58f]/60">
            {hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-4 py-3">
                <dt className="font-medium">{h.days}</dt>
                <dd className="text-right text-sm tabular-nums text-muted-foreground">{h.hours}</dd>
              </div>
            ))}
          </dl>

          <VIPBookingModal>
            <button type="button" className="text-left font-serif text-lg italic text-gold underline-offset-4 hover:underline">
              Eredità o lotti importanti? Prenota una perizia riservata →
            </button>
          </VIPBookingModal>
        </div>
      </div>

      <div className={cn(goldFrame, "min-h-[420px] lg:col-span-7")}>
        <div className="relative h-full min-h-[420px] overflow-hidden bg-[#fffdf7]">
          <iframe
            title={`Mappa: ${fullAddress}, zona Stazione di Bergamo`}
            src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
            className="absolute inset-0 h-full w-full grayscale-[0.6] sepia-[0.2]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
