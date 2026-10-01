import { ShieldCheck, Scale, Star, MapPin, Clock, Phone, Train, Navigation } from "lucide-react";
import siteData from "@/data/site-data.json";

const { address, contacts, hours, trust } = siteData;
const fullAddress = `${address.street}, ${address.cap} ${address.city} (${address.province})`;
const mapsQuery = encodeURIComponent(`${address.street}, ${address.cap} ${address.city}`);

export default function TrustSection() {
  return (
    <section id="negozio" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-20">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <h3 className="mt-3 font-semibold text-white">{trust.legalNotes[0]}</h3>
            <p className="text-sm text-zinc-500 mt-1">Operatore professionale autorizzato, transazioni tracciate a norma di legge.</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
            <Scale className="w-7 h-7 text-amber-400" />
            <h3 className="mt-3 font-semibold text-white">{trust.legalNotes[1]}</h3>
            <p className="text-sm text-zinc-500 mt-1">Pesi il tuo oro davanti a te: nessuna sorpresa.</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
          <div className="text-5xl font-black font-mono text-white">{trust.googleRating.toFixed(1)}</div>
          <div>
            <div className="flex gap-0.5" aria-label={`${trust.googleRating} su ${trust.googleRatingMax}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Valutazione Google su {trust.googleRatingMax.toFixed(1)} · {trust.reviewsLabel}
            </p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">{siteData.name}</div>
              <div className="text-zinc-400">{fullAddress}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Train className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-zinc-400">{address.landmark}</div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-zinc-500">{h.days}</dt>
                  <dd className="text-zinc-200 font-mono">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-amber-400 shrink-0" />
            <a href={`tel:${contacts.phoneIntl}`} className="text-zinc-200 hover:text-amber-300">
              {contacts.phone}
            </a>
            <span className="text-zinc-600">·</span>
            <a href={`mailto:${contacts.email}`} className="text-zinc-200 hover:text-amber-300 break-all">
              {contacts.email}
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 min-h-80">
        <iframe
          title={`Mappa: ${fullAddress}`}
          src={`https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`}
          className="w-full flex-1 min-h-80 grayscale-[60%] invert-[90%] hue-rotate-180"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors"
        >
          <Navigation className="w-5 h-5" />
          Indicazioni stradali per Via Angelo Maj 39/B
        </a>
      </div>
    </section>
  );
}
