import { Check, MapPin, Star } from "lucide-react";
import siteData from "@/data/site-data.json";
import GoldCalculator from "@/components/GoldCalculator";

const { address, trust } = siteData;

const GUARANTEES = [
  ...trust.legalNotes,
  "Valutazione gratuita e senza impegno",
  `Pagamento immediato: ${siteData.payment.toLowerCase()}`,
];

export default function HeroSection() {
  return (
    <section className="border-b border-border bg-ivory">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div className="lg:pt-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-gold">Compro Oro · Bergamo Centro</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Valutazione trasparente e quotazioni oro in tempo reale a Bergamo
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Inserisci peso e caratura per conoscere subito la stima. Poi vieni in negozio: pesiamo il tuo oro davanti a
            te e ti paghiamo al momento.
          </p>

          <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
            <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
            <div className="text-sm">
              <div className="font-medium text-foreground">
                {address.street}, {address.cap} {address.city}
              </div>
              <div className="text-muted-foreground">{address.landmark}</div>
            </div>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {GUARANTEES.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="mt-0.5 size-4 shrink-0 text-guarantee" />
                {g}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-gold-light text-gold-light" />
              ))}
            </div>
            <span>
              <span className="font-semibold text-foreground">{trust.googleRating.toFixed(1)}</span> su Google ·{" "}
              {trust.reviewsLabel}
            </span>
          </div>
        </div>

        <GoldCalculator />
      </div>
    </section>
  );
}
