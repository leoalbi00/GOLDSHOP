import { Scale, ShieldCheck, Star, Timer, Banknote, MapPin } from "lucide-react";
import siteData from "@/data/site-data.json";
import reviewsData from "@/data/reviews.json";

interface Review {
  author: string;
  text: string;
  rating: number;
}

const reviews = reviewsData.reviews as Review[];
const { trust, links, pricing, address } = siteData;

/** Senza recensioni caricate il nastro mostra solo fatti verificabili: rating Google e garanzie del negozio. */
const FACTS = [
  { icon: Star, text: `${trust.googleRating.toFixed(1).replace(".", ",")}/5 su Google · ${trust.reviewsLabel}` },
  { icon: Scale, text: "Pesata a vista su bilancia omologata" },
  { icon: ShieldCheck, text: "Iscritti al Registro Compro Oro OAM" },
  { icon: Timer, text: `Prezzo bloccato online per ${pricing.voucherValidityHours} ore` },
  { icon: Banknote, text: "Pagamento immediato nei termini di legge" },
  { icon: MapPin, text: `${address.street}, Bergamo · zona Stazione` },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="flex" aria-label={`${n} stelle su 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-4 ${i < n ? "fill-gold text-gold" : "text-hairline"}`} />
      ))}
    </span>
  );
}

/** Nastro a scorrimento continuo (si ferma al passaggio del mouse e con prefers-reduced-motion). */
export default function AnimatedReviews() {
  const hasReviews = reviews.length > 0;
  const items = hasReviews ? reviews : FACTS;
  // Lista duplicata: a metà corsa il nastro riparte identico, senza salti.
  const loop = [...items, ...items];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <a href={links.googleReviews} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4">
          <span className="font-serif text-6xl font-medium leading-none tabular-nums">{trust.googleRating.toFixed(1).replace(".", ",")}</span>
          <span>
            <Stars n={Math.round(trust.googleRating)} />
            <span className="mt-1 block text-sm text-muted-foreground group-hover:text-foreground">
              su {trust.googleRatingMax} · Google · {trust.reviewsLabel} →
            </span>
          </span>
        </a>
      </div>

      <div
        className="marquee relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
        style={{ ["--marquee-duration" as string]: `${items.length * (hasReviews ? 12 : 6)}s` }}
        role="region"
        aria-label={hasReviews ? "Recensioni dei clienti" : "Perché sceglierci"}
      >
        <ul className="marquee-track flex w-max gap-4 motion-reduce:w-full motion-reduce:flex-wrap">
          {loop.map((item, i) => (
            <li
              key={i}
              aria-hidden={i >= items.length}
              className={i >= items.length ? "motion-reduce:hidden" : undefined}
            >
              {"author" in item ? (
                <figure className="flex h-full w-80 flex-col justify-between border border-hairline bg-paper p-6">
                  <Stars n={item.rating} />
                  <blockquote className="mt-4 font-serif text-lg leading-snug">“{item.text}”</blockquote>
                  <figcaption className="mt-4 text-sm font-semibold">
                    {item.author} <span className="font-normal text-muted-foreground">· Google</span>
                  </figcaption>
                </figure>
              ) : (
                <div className="flex items-center gap-3 whitespace-nowrap border border-hairline bg-paper px-6 py-4 font-serif text-xl">
                  <item.icon className="size-5 text-gold" strokeWidth={1.5} /> {item.text}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
