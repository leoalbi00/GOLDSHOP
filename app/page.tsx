import { MapPin, Phone, MessageCircle, ShieldCheck, Star } from "lucide-react";
import siteData from "@/data/site-data.json";
import LiveTicker from "@/components/LiveTicker";
import GoldCalculator from "@/components/GoldCalculator";
import GoldChart from "@/components/GoldChart";
import TrustSection from "@/components/TrustSection";

const { address, contacts, trust } = siteData;
const waNumber = contacts.whatsapp.replace(/\D/g, "");

export default function Home() {
  return (
    <>
      <LiveTicker />

      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <a href="#" className="font-serif text-xl font-bold text-amber-300 tracking-wide">
            {siteData.shortName}
          </a>
          <a
            href={`tel:${contacts.phoneIntl}`}
            className="flex items-center gap-2 rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/10"
          >
            <Phone className="w-4 h-4" />
            {contacts.phone}
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-24 space-y-16">
        <section className="pt-14 md:pt-20 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-200">
            <MapPin className="w-3.5 h-3.5" />
            {address.street}, Bergamo Centro · vicino alla Stazione
          </div>
          <h1 className="mt-6 font-serif text-4xl md:text-6xl font-bold leading-tight text-white">
            Compro Oro a Bergamo,{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              al giusto valore
            </span>
          </h1>
          <p className="mt-5 text-lg text-zinc-400">
            Calcola online quanto vale il tuo oro, blocca il prezzo per 24 ore e passa in negozio: pesatura a vista e
            pagamento immediato.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#calcolatore"
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-7 py-4 font-bold text-black shadow-xl shadow-amber-500/20"
            >
              Calcola il valore
            </a>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-7 py-4 font-semibold text-emerald-300 hover:bg-emerald-500/10"
            >
              <MessageCircle className="w-5 h-5" />
              Scrivici su WhatsApp
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {trust.googleRating.toFixed(1)} su Google · {trust.reviewsLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {trust.legalNotes[0]}
            </span>
          </div>
        </section>

        <GoldCalculator />
        <GoldChart />
        <TrustSection />
      </main>

      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600 px-4">
        <p>
          {siteData.name} · {address.street}, {address.cap} {address.city} ({address.province}) · {contacts.email}
        </p>
        <p className="mt-1">
          Le quotazioni e le stime online sono indicative; il valore finale è determinato in negozio.
        </p>
      </footer>
    </>
  );
}
