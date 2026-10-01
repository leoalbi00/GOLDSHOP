import { ArrowUpRight, Phone } from "lucide-react";
import siteData from "@/data/site-data.json";
import RevealTitle from "@/components/RevealTitle";
import OpenStatus from "@/components/OpenStatus";
import VIPSection from "@/components/VIPSection";
import TrustAndReviews from "@/components/TrustAndReviews";

const { address, hours, contacts } = siteData;
const fullAddress = `${address.street}, ${address.cap} ${address.city}`;
const mapsQuery = encodeURIComponent(fullAddress);
const { lat, lng } = address.coordinates;

const NAVIGATORS = [
  { label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}` },
  { label: "Apple Mappe", href: `https://maps.apple.com/?daddr=${mapsQuery}&dirflg=d` },
  { label: "Waze", href: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
];

const eyebrow = "text-[11px] font-medium uppercase tracking-[0.24em]";

export default function VisitSection() {
  return (
    <>
      <section id="trasparenza" aria-labelledby="trasparenza-title" className="scroll-mt-24 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className={`${eyebrow} text-gold lg:col-span-4`}>N° 02 — Trasparenza</div>
            <RevealTitle
              id="trasparenza-title"
              className="font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl lg:col-span-8"
              segments={["Nulla dietro il banco.", { text: "Tutto sotto i tuoi occhi.", className: "italic" }]}
            />
          </div>

          <div className="mt-16">
            <TrustAndReviews />
          </div>
        </div>
      </section>

      <VIPSection />

      <section id="visita" aria-labelledby="visita-title" className="scroll-mt-24 border-b border-border bg-paper">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
          <div className="flex flex-col lg:col-span-5">
            <div className={`${eyebrow} text-gold`}>N° 04 — Visita</div>
            <RevealTitle
              id="visita-title"
              className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl"
              segments={["A due passi", { text: "dalla Stazione.", className: "italic" }]}
            />

            <address className="mt-8 not-italic">
              <div className="text-xl font-medium">{address.street}</div>
              <div className="text-muted-foreground">
                {address.cap} {address.city} ({address.province})
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{address.landmark}.</div>
            </address>

            <div className="mt-10">
              <OpenStatus />
              <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
                {hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">{h.days}</dt>
                    <dd className="text-right tabular-nums">{h.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-10">
              <div className={`${eyebrow} text-muted-foreground`}>Apri nel navigatore</div>
              <ul className="mt-3 grid grid-cols-3 border border-hairline">
                {NAVIGATORS.map((n) => (
                  <li key={n.label} className="border-l border-hairline first:border-l-0">
                    <a
                      href={n.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-2 py-3.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
                    >
                      {n.label}
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={`tel:${contacts.phoneIntl}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="size-3.5" /> Prima di venire, chiama il {contacts.phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative h-[420px] overflow-hidden rounded-sm border border-hairline lg:h-full lg:min-h-[560px]">
              <iframe
                title={`Mappa: ${fullAddress}, zona Stazione di Bergamo`}
                src={`https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`}
                className="absolute inset-0 h-full w-full grayscale-[0.85] sepia-[0.15] contrast-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
