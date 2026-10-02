import siteData from "@/data/site-data.json";
import Header from "@/components/Header";
import HeroVideo from "@/components/HeroVideo";
import ScrollReveal from "@/components/ScrollReveal";
import AboutUs from "@/components/AboutUs";
import RecordHighNotice from "@/components/RecordHighNotice";
import ShopGallery, { availableShopPhotos } from "@/components/ShopGallery";
import AtmosphereGallery from "@/components/AtmosphereGallery";
import GoogleReviews from "@/components/GoogleReviews";
import ContactSection from "@/components/ContactSection";

const { address, contacts, trust } = siteData;
/** Con foto reali in public/images/shop/ si mostra il negozio; altrimenti foto di atmosfera, senza spacciarle per la sede. */
const shopPhotos = availableShopPhotos();

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
      <RecordHighNotice />
      <Header />
      <main>
        <HeroVideo />

        <section id="chi-siamo" aria-labelledby="about-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 text-xs font-semibold uppercase tracking-[0.24em] text-gold">Chi siamo · Trasparenza</div>
            <ScrollReveal parallax={0}>
              <AboutUs />
            </ScrollReveal>
          </div>
        </section>

        <section id="galleria" aria-labelledby="gallery-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              {shopPhotos.length > 0 ? (
                <SectionTitle id="gallery-title" eyebrow="Il negozio" title="La nostra sede a Bergamo." />
              ) : (
                <SectionTitle id="gallery-title" eyebrow="Oro · Monete · Gioielli" title="Ciò che valutiamo ogni giorno." />
              )}
            </ScrollReveal>
            {shopPhotos.length > 0 ? <ShopGallery photos={shopPhotos} /> : <AtmosphereGallery />}
          </div>
        </section>

        <section id="recensioni" aria-labelledby="reviews-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="reviews-title" eyebrow="Recensioni Google" title="Cosa dicono i nostri clienti." />
            </ScrollReveal>
            <GoogleReviews />
          </div>
        </section>

        <section id="contatti" aria-labelledby="contact-title" className="scroll-mt-24 border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal parallax={0}>
              <SectionTitle id="contact-title" eyebrow="Contatti & orari" title="Vieni a trovarci." />
            </ScrollReveal>
            <ContactSection />
          </div>
        </section>
      </main>
      <footer className="bg-foreground text-background/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 text-sm sm:px-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-serif text-3xl font-medium text-background">
              123 <span className="italic text-[#d6b37a]">Gold</span>
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
