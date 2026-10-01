"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Scale, Star, MapPin, Clock, Phone, Mail, Train, Navigation, ExternalLink } from "lucide-react";
import siteData from "@/data/site-data.json";

const { address, contacts, hours, trust, links } = siteData;
const fullAddress = `${address.street}, ${address.cap} ${address.city} (${address.province})`;
const mapsQuery = encodeURIComponent(`${address.street}, ${address.cap} ${address.city}`);

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
} as const;

export default function TrustAndReviews() {
  return (
    <section id="negozio" className="scroll-mt-24 space-y-10">
      <div className="text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Perché sceglierci</span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-1">Fiducia, trasparenza, vicinanza</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.a
          {...reveal}
          transition={{ duration: 0.6 }}
          href={links.googleReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black font-mono text-white">{trust.googleRating.toFixed(1)}</span>
            <span className="text-zinc-500">/ {trust.googleRatingMax.toFixed(1)}</span>
          </div>
          <div className="mt-2 flex gap-0.5" aria-label={`${trust.googleRating} stelle su ${trust.googleRatingMax}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-300">Recensioni Google · {trust.reviewsLabel}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs text-amber-300 group-hover:underline">
            Leggi le recensioni <ExternalLink className="w-3 h-3" />
          </span>
        </motion.a>
        <motion.div {...reveal} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <h3 className="mt-3 font-semibold text-white">{trust.legalNotes[0]}</h3>
          <p className="text-sm text-zinc-500 mt-1">Operatore autorizzato, transazioni tracciate a norma di legge.</p>
        </motion.div>
        <motion.div {...reveal} transition={{ duration: 0.6, delay: 0.2 }} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <Scale className="w-8 h-8 text-amber-400" />
          <h3 className="mt-3 font-semibold text-white">{trust.legalNotes[1]}</h3>
          <p className="text-sm text-zinc-500 mt-1">Il tuo oro viene pesato davanti a te.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <motion.div {...reveal} transition={{ duration: 0.6 }} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 text-sm">
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
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-amber-400 shrink-0" />
            <a href={`tel:${contacts.phoneIntl}`} className="text-zinc-200 hover:text-amber-300">
              {contacts.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-amber-400 shrink-0" />
            <a href={`mailto:${contacts.email}`} className="text-zinc-200 hover:text-amber-300 break-all">
              {contacts.email}
            </a>
          </div>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950"
        >
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
        </motion.div>
      </div>
    </section>
  );
}
