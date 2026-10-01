import { Phone } from "lucide-react";
import siteData from "@/data/site-data.json";
import LiveTicker from "@/components/LiveTicker";
import HeroParallax from "@/components/HeroParallax";
import ProcessTimeline from "@/components/ProcessTimeline";
import GoldChartSection from "@/components/GoldChartSection";
import TrustAndReviews from "@/components/TrustAndReviews";

const { address, contacts } = siteData;

const NAV = [
  { href: "#calcolatore", label: "Calcola" },
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#andamento", label: "Quotazioni" },
  { href: "#negozio", label: "Dove siamo" },
];

export default function Home() {
  return (
    <>
      <LiveTicker />

      <header className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <a href="#" className="font-serif text-2xl font-bold tracking-wide">
            <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
              {siteData.shortName}
            </span>
            <span className="ml-2 hidden sm:inline text-xs font-sans font-normal text-zinc-500">Compro Oro Bergamo</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-amber-300 transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href={`tel:${contacts.phoneIntl}`}
            className="flex items-center gap-2 rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/10"
          >
            <Phone className="w-4 h-4" />
            {contacts.phone}
          </a>
        </div>
      </header>

      <main className="space-y-28 pb-28">
        <HeroParallax />
        <div className="max-w-7xl mx-auto px-4 space-y-28">
          <ProcessTimeline />
          <GoldChartSection />
          <TrustAndReviews />
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-600 px-4 space-y-1">
        <p className="text-zinc-400">
          {siteData.name} · {address.street}, {address.cap} {address.city} ({address.province})
        </p>
        <p>
          {contacts.phone} · {contacts.email}
        </p>
        <p>{siteData.trust.legalNotes.join(" · ")}</p>
        <p>Quotazioni e stime online sono indicative; il valore finale è determinato in negozio.</p>
      </footer>
    </>
  );
}
