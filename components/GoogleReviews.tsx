import { Star } from "lucide-react";
import { getReviews } from "@/lib/server/google-reviews";

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${n} stelle su 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${className ?? "size-4"} ${i < n ? "fill-[#b8925a] text-[#b8925a]" : "text-hairline"}`} />
      ))}
    </span>
  );
}

const countFmt = new Intl.NumberFormat("it-IT");

/** Voto Google in evidenza e recensioni reali visibili a schermo (Places API o data/reviews.json). */
export default async function GoogleReviews() {
  const { rating, count, reviews, mapsUrl } = await getReviews();
  return (
    <div>
      <div className="flex flex-col items-start gap-6 border-y border-[#b8925a]/40 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <span className="font-serif text-7xl font-medium leading-none tabular-nums">{rating.toFixed(1).replace(".", ",")}</span>
          <div>
            <Stars n={Math.round(rating)} className="size-5" />
            <div className="mt-2 text-sm text-muted-foreground">su 5 · {countFmt.format(count)} recensioni su Google</div>
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center border border-foreground px-6 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
        >
          Leggi tutte le recensioni su Google →
        </a>
      </div>

      {reviews.length > 0 && (
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.author + r.text.slice(0, 24)}>
              <figure className="flex h-full flex-col border border-hairline bg-paper p-7">
                <Stars n={r.rating} />
                <blockquote className="mt-5 flex-1 font-serif text-xl leading-snug">“{r.text}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-4 hover:underline">
                      {r.author}
                    </a>
                  ) : (
                    <span className="font-semibold">{r.author}</span>
                  )}
                  <span className="text-muted-foreground"> · Google{r.when ? ` · ${r.when}` : ""}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
