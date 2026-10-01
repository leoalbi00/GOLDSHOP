import siteData from "@/data/site-data.json";
import LiveTicker from "@/components/LiveTicker";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MarketSection from "@/components/MarketSection";
import VisitSection from "@/components/VisitSection";

const { address, contacts, trust } = siteData;

export default function Home() {
  return (
    <>
      <LiveTicker />
      <Header />
      <main>
        <HeroSection />
        <MarketSection />
        <VisitSection />
      </main>
      <footer className="bg-foreground text-background/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 text-sm sm:px-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-serif text-3xl font-medium text-background">
              Compro Oro <span className="italic text-[#d6b37a]">123</span>
            </div>
            <div className="mt-3">
              {address.street}, {address.cap} {address.city} ({address.province})
            </div>
          </div>
          <div className="space-y-1 md:col-span-3">
            <a href={`tel:${contacts.phoneIntl}`} className="block text-background transition-colors hover:text-[#d6b37a]">
              {contacts.phone}
            </a>
            <a href={`mailto:${contacts.email}`} className="block text-background transition-colors hover:text-[#d6b37a]">
              {contacts.email}
            </a>
          </div>
          <div className="space-y-1 md:col-span-4">
            {trust.legalNotes.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
        </div>
        <div className="border-t border-background/10 px-4 py-5 text-center text-xs text-background/50">
          Quotazioni e stime online sono indicative; il valore finale è determinato in negozio.
        </div>
      </footer>
    </>
  );
}
