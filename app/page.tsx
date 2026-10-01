import siteData from "@/data/site-data.json";
import LiveTicker from "@/components/LiveTicker";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TrustGrid from "@/components/TrustGrid";

const { address, contacts, trust } = siteData;

export default function Home() {
  return (
    <>
      <LiveTicker />
      <Header />
      <main>
        <HeroSection />
        <TrustGrid />
      </main>
      <footer className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:grid-cols-3">
          <div>
            <div className="font-serif text-lg font-semibold text-foreground">{siteData.name}</div>
            <div className="mt-1">
              {address.street}, {address.cap} {address.city} ({address.province})
            </div>
          </div>
          <div className="space-y-1">
            <div>
              Tel.{" "}
              <a href={`tel:${contacts.phoneIntl}`} className="text-foreground hover:text-gold">
                {contacts.phone}
              </a>
            </div>
            <div>
              <a href={`mailto:${contacts.email}`} className="text-foreground hover:text-gold">
                {contacts.email}
              </a>
            </div>
          </div>
          <div className="space-y-1">
            {trust.legalNotes.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          Quotazioni e stime online sono indicative; il valore finale è determinato in negozio.
        </div>
      </footer>
    </>
  );
}
