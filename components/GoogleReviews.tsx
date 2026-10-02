import { Star } from "lucide-react";
import siteData from "@/data/site-data.json";
import reviewsData from "@/data/reviews.json";

interface Review {
  author: string;
  text: string;
  rating: number;
}

/** Solo recensioni reali copiate dalla scheda Google (vedi la nota in data/reviews.json). */
const reviews = reviewsData.reviews as Review[];
const { trust, links } = siteData;

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${n} stelle su 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${className ?? "size-4"} ${i < n ? "fill-[#b8925a] text-[#b8925a]" : "text-hairline"}`} />
      ))}
    </span>
  );
}

/** Rating Google in evidenza e recensioni visibili a schermo, in una griglia statica. */
export default function GoogleReviews() {
  const rating = trust.googleRating.toFixed(1).replace(".", ",");
  return (
    <div>
      <div className="flex flex-col items-start gap-6 border-y border-[#b8925a]/40 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <span className="font-serif text-7xl font-medium leading-none tabular-nums">{rating}</span>
          <div>
            <Stars n={Math.round(trust.googleRating)} className="size-5" />
            <div className="mt-2 text-sm text-muted-foreground">
              su {trust.googleRatingMax} · {trust.reviewsLabel} su Google
            </div>
          </div>
        </div>
        <a
          href={links.googleReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center border border-foreground px-6 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
        >
          Leggi tutte le recensioni su Google →
        </a>
      </div>

      {reviews.length > 0 && (
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.author + r.text.slice(0, 16)}>
              <figure className="flex h-full flex-col border border-hairline bg-paper p-7">
                <Stars n={r.rating} />
                <blockquote className="mt-5 flex-1 font-serif text-xl leading-snug">“{r.text}”</blockquote>
                <figcaption className="mt-6 text-sm font-semibold">
                  {r.author} <span className="font-normal text-muted-foreground">· Recensione Google</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
