import siteData from "@/data/site-data.json";
import LiveTicker from "@/components/LiveTicker";
import Header from "@/components/Header";
import HeroVideo from "@/components/HeroVideo";
import ScrollReveal from "@/components/ScrollReveal";
import SimpleGoldCalculator from "@/components/SimpleGoldCalculator";
import TrustAndReviews from "@/components/TrustAndReviews";
import DirectLocation from "@/components/DirectLocation";

const { address, contacts, trust } = siteData;

function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{eyebrow}</div>
      <h2 id={id} className="mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl">
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <LiveTicker />
      <Header />
      <main>
        <HeroVideo />

        <section id="calcolatore" aria-labelledby="calc-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="calc-title" eyebrow="1 · Calcola" title="Quanto vale il tuo oro, adesso." />
            </ScrollReveal>
            <ScrollReveal delay={0.1} parallax={20}>
              <SimpleGoldCalculator />
            </ScrollReveal>
          </div>
        </section>

        <section id="passaggi" aria-labelledby="steps-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="steps-title" eyebrow="2 · Come funziona" title="Tre passaggi, tutto davanti a te." />
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <TrustAndReviews />
            </ScrollReveal>
          </div>
        </section>

        <section id="visita" aria-labelledby="visit-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="visit-title" eyebrow="3 · Vieni in negozio" title="A due passi dalla Stazione." />
            </ScrollReveal>
            <ScrollReveal delay={0.1} parallax={24}>
              <DirectLocation />
            </ScrollReveal>
          </div>
        </section>
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
