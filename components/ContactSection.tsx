"use client";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import siteData from "@/data/site-data.json";
import { reopensLabel, useStoreStatus } from "@/lib/useStoreStatus";
import { waLink } from "@/lib/whatsapp-engine";
import { cn } from "@/lib/cn";

const { address, hours, contacts } = siteData;
const fullAddress = `${address.street}, ${address.cap} ${address.city} (${address.province})`;
const q = encodeURIComponent(`${address.street}, ${address.cap} ${address.city}`);
const MAPS_NAV = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
const WHATSAPP = waLink(contacts.whatsapp, "Buongiorno, vorrei avere informazioni per una valutazione.");

function StoreStatusLine() {
  const s = useStoreStatus();
  if (!s) return <div className="h-5" />;
  return (
    <div aria-live="polite" className={cn("flex items-center gap-2 text-sm font-semibold", s.open ? "text-guarantee" : "text-rose-800")}>
      <span className={cn("size-2 rounded-full", s.open ? "bg-guarantee" : "bg-rose-700")} />
      {s.open ? `Aperto ora · fino alle ${s.closesAt}` : `Chiuso ora · ${reopensLabel(s)}`}
    </div>
  );
}

const button = "flex h-14 items-center justify-center gap-2 px-5 text-sm font-semibold tracking-wide transition-colors";

/** Indirizzo, orari effettivi da data/site-data.json e i tre contatti diretti. */
export default function ContactSection() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-8 lg:col-span-5">
        <address className="not-italic">
          <div className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{address.street}</div>
          <div className="mt-2 text-lg text-muted-foreground">
            {address.cap} {address.city} ({address.province})
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{address.landmark}</div>
        </address>

        <div>
          <StoreStatusLine />
          <dl className="mt-4 divide-y divide-[#b8925a]/30 border-y border-[#b8925a]/30">
            {hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-4 py-3">
                <dt className="font-medium">{h.days}</dt>
                <dd className="text-right tabular-nums text-muted-foreground">{h.hours}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-2">
          <a href={`tel:${contacts.phoneIntl}`} className={cn(button, "bg-foreground text-background hover:bg-[#1f2937]")}>
            <Phone className="size-4" /> Chiama Ora · {contacts.phone}
          </a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={cn(button, "bg-[#1f7a4d] text-white hover:bg-[#19663f]")}>
            <MessageCircle className="size-4" /> Scrivi su WhatsApp
          </a>
          <a
            href={MAPS_NAV}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(button, "border border-foreground text-foreground hover:bg-foreground hover:text-background")}
          >
            <MapPin className="size-4" /> Ottieni Indicazioni (Google Maps)
          </a>
        </div>
      </div>

      <div className="border border-[#b8925a]/60 p-1.5 lg:col-span-7">
        <div className="relative h-full min-h-[380px] overflow-hidden bg-muted">
          <iframe
            title={`Mappa: ${fullAddress}`}
            src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
            className="absolute inset-0 h-full w-full grayscale-[0.5]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
