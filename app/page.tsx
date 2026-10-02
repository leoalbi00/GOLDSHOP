import siteData from "@/data/site-data.json";
import LiveTicker from "@/components/LiveTicker";
import Header from "@/components/Header";
import HeroVideo from "@/components/HeroVideo";
import ScrollReveal from "@/components/ScrollReveal";
import PromoBanner from "@/components/PromoBanner";
import AttractiveCalculator from "@/components/AttractiveCalculator";
import ThreePillars from "@/components/ThreePillars";
import AnimatedReviews from "@/components/AnimatedReviews";
import LuxuryLocation from "@/components/LuxuryLocation";

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
      <Header />
      <main>
        {/* 1. Hero · 2. Quotazioni */}
        <HeroVideo />
        <LiveTicker />

        {/* 3. Calcolatore */}
        <section id="calcolatore" aria-labelledby="calc-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="calc-title" eyebrow="Calcola · Blocca · Sblocca il bonus" title="Quanto vale il tuo oro, adesso." />
            </ScrollReveal>
            <PromoBanner />
            <ScrollReveal delay={0.1} parallax={0}>
              <AttractiveCalculator />
            </ScrollReveal>
          </div>
        </section>

        {/* 4. Pilastri */}
        <section id="perche-noi" aria-labelledby="pillars-title" className="scroll-mt-24 border-b border-border bg-muted/40 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="pillars-title" eyebrow="Il negozio" title="Trasparenza che puoi vedere." />
            </ScrollReveal>
            <ThreePillars />
          </div>
        </section>

        {/* 5. Recensioni */}
        <section id="recensioni" aria-labelledby="reviews-title" className="scroll-mt-24 overflow-hidden border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="reviews-title" eyebrow="Dicono di noi" title="La fiducia di Bergamo." />
            </ScrollReveal>
            <AnimatedReviews />
          </div>
        </section>

        {/* 6. Vieni a trovarci */}
        <section id="visita" aria-labelledby="visit-title" className="scroll-mt-24 border-b border-border bg-[radial-gradient(ellipse_at_top,#f6efe4,transparent_70%)] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="visit-title" eyebrow="Vieni a trovarci" title="Vieni a trovarci in Sede" />
            </ScrollReveal>
            <ScrollReveal delay={0.1} parallax={16}>
              <LuxuryLocation />
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
