import { MapPin, Scale, ShieldCheck, Star } from "lucide-react";
import siteData from "@/data/site-data.json";
import BespokeCalculator from "@/components/BespokeCalculator";
import RevealTitle from "@/components/RevealTitle";

const { address, trust } = siteData;

export default function HeroSection() {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="flex flex-col lg:col-span-7 lg:pr-8">
          <div className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <span className="text-gold">Bergamo · Zona Stazione</span>
            <span className="h-px w-12 bg-hairline" />
            <span>Dal banco di Via Angelo Maj</span>
          </div>

          <RevealTitle
            as="h1"
            trigger="load"
            className="mt-8 text-balance font-serif text-[clamp(2.75rem,6.4vw,5.75rem)] font-medium leading-[0.98] tracking-[-0.02em] text-foreground"
            segments={[
              "Il valore del tuo oro,",
              { text: "pesato davanti a te.", className: "italic text-gold" },
            ]}
          />

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Quotazione aggiornata, stima al decimo di grammo e prezzo bloccato per{" "}
            {siteData.pricing.voucherValidityHours} ore. Poi in negozio: pesatura a vista su bilancia omologata e
            pagamento immediato.
          </p>

          <ul className="mt-10 flex flex-wrap gap-2.5" aria-label="Garanzie">
            <li className="inline-flex items-center gap-2 rounded-full border border-guarantee/25 bg-guarantee-soft px-3.5 py-1.5 text-xs font-medium text-guarantee">
              <ShieldCheck className="size-3.5" />
              Iscritto al Registro Compro Oro OAM
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3.5 py-1.5 text-xs font-medium text-foreground">
              <Scale className="size-3.5 text-gold" />
              Bilancia di precisione omologata
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3.5 py-1.5 text-xs font-medium text-foreground">
              <Star className="size-3.5 fill-gold text-gold" />
              <span className="tabular-nums">{trust.googleRating.toFixed(1).replace(".", ",")}</span> su Google ·{" "}
              {trust.reviewsLabel}
            </li>
          </ul>

          <div className="mt-auto pt-14">
            <a
              href="#visita"
              className="group inline-flex items-start gap-4 border-t border-foreground pt-4 text-sm text-foreground"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>
                <span className="block font-medium">
                  {address.street}, {address.cap} {address.city}
                </span>
                <span className="block text-muted-foreground transition-colors group-hover:text-foreground">
                  {address.landmark} →
                </span>
              </span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <BespokeCalculator />
        </div>
      </div>
    </section>
  );
}
