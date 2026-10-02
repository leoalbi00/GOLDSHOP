"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";

interface Photo {
  src: string;
  alt: string;
  credit: { author: string; license: string; licenseUrl?: string; source: string };
}

/**
 * Foto di atmosfera (non del negozio), reali e con licenza libera da Wikimedia Commons.
 * Le licenze CC BY / CC BY-SA richiedono il credito all'autore: è nell'elenco sotto la griglia.
 */
const TILES: { caption: string; photos: [Photo, Photo] }[] = [
  {
    caption: "Lingotti e oro da investimento",
    photos: [
      {
        src: "/images/atmosphere/bullion-coins.jpg",
        alt: "Lingotto d'oro da 100 grammi con monete d'oro da investimento",
        credit: {
          author: "Apollo2005",
          license: "CC BY-SA 3.0",
          licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
          source: "https://commons.wikimedia.org/wiki/File:Anlagegold_gelb.JPG",
        },
      },
      {
        src: "/images/atmosphere/gold-ingots.jpg",
        alt: "Due lingotti d'oro su fondo bianco",
        credit: { author: "Szaaman", license: "Pubblico dominio", source: "https://commons.wikimedia.org/wiki/File:Gold_Ingots_on_white_background.jpg" },
      },
    ],
  },
  {
    caption: "Monete d'oro",
    photos: [
      {
        src: "/images/atmosphere/sovereigns.jpg",
        alt: "Sei sterline d'oro con San Giorgio e il drago",
        credit: { author: "Snd3054", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Branch_Mint_Sovereigns.jpg" },
      },
      {
        src: "/images/atmosphere/krugerrands.jpg",
        alt: "Monete d'oro Krugerrand da un'oncia",
        credit: {
          author: "Gage Skidmore",
          license: "CC BY-SA 3.0",
          licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
          source: "https://commons.wikimedia.org/wiki/File:Three_one_ounce_Gold_Krugerrands_by_Gage_Skidmore.jpg",
        },
      },
    ],
  },
  {
    caption: "Gioielli e oro usato",
    photos: [
      {
        src: "/images/atmosphere/gold-rings.jpg",
        alt: "Due anelli d'oro con diamante",
        credit: {
          author: "Thomas Quine",
          license: "CC BY 2.0",
          licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
          source: "https://commons.wikimedia.org/wiki/File:Diamond_and_gold_rings_(39538047354).jpg",
        },
      },
      {
        src: "/images/atmosphere/scrap-gold.jpg",
        alt: "Ritagli di oro e argento da rifondere",
        credit: {
          author: "W.carter",
          license: "CC BY 4.0",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          source: "https://commons.wikimedia.org/wiki/File:Silver_and_gold_scrap_metal.jpg",
        },
      },
    ],
  },
];

const INTERVAL_MS = 6000;

/** Riquadro che alterna due foto in dissolvenza; i riquadri sono sfalsati per non cambiare tutti insieme. */
function Tile({ caption, photos, offset }: { caption: string; photos: [Photo, Photo]; offset: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setShown((s) => 1 - s);
      id = setInterval(() => setShown((s) => 1 - s), INTERVAL_MS);
    }, INTERVAL_MS + offset);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [reduce, offset]);

  return (
    <figure>
      <div className="border border-[#b8925a]/60 p-1.5">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {photos.map((p, i) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              aria-hidden={i !== shown}
              className="object-cover transition-opacity duration-[1500ms] ease-in-out"
              style={{ opacity: i === shown ? 1 : 0 }}
            />
          ))}
        </div>
      </div>
      <figcaption className="mt-3 font-serif text-xl italic">{caption}</figcaption>
    </figure>
  );
}

export default function AtmosphereGallery() {
  return (
    <div>
      <ul className="grid gap-6 md:grid-cols-3">
        {TILES.map((t, i) => (
          <li key={t.caption}>
            <Tile caption={t.caption} photos={t.photos} offset={i * 2000} />
          </li>
        ))}
      </ul>
      <details className="mt-8 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Crediti fotografici</summary>
        <ul className="mt-2 space-y-1">
          {TILES.flatMap((t) => t.photos).map(({ src, credit }) => (
            <li key={src}>
              <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                Foto di {credit.author}
              </a>{" "}
              via Wikimedia Commons ·{" "}
              {credit.licenseUrl ? (
                <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  {credit.license}
                </a>
              ) : (
                credit.license
              )}
              {credit.licenseUrl ? " · ritagliata e ridimensionata" : ""}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
