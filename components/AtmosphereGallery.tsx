import Image from "next/image";

/**
 * Foto di atmosfera reali, tutte CC0 o pubblico dominio (fonti in public/images/atmosphere/README.md):
 * non richiedono crediti. Non sono foto del negozio, quindi le didascalie restano neutre.
 */
const PHOTOS = [
  { src: "/images/atmosphere/gold-ingots.jpg", alt: "Due lingotti d'oro su fondo bianco", caption: "Lingotti d'oro" },
  { src: "/images/atmosphere/fine-gold-999.jpg", alt: "Lingottino da 1 grammo d'oro fino 999,9 nel suo certificato", caption: "Oro fino 999,9" },
  { src: "/images/atmosphere/sovereigns.jpg", alt: "Sei sterline d'oro con San Giorgio e il drago", caption: "Sterline d'oro" },
  { src: "/images/atmosphere/krugerrand.jpg", alt: "Moneta d'oro Krugerrand da un'oncia del 1975", caption: "Monete da investimento" },
  { src: "/images/atmosphere/gold-necklace.jpg", alt: "Collana d'oro a festoni con pendenti", caption: "Collane in oro" },
  { src: "/images/atmosphere/gold-pendant.jpg", alt: "Dettaglio di un pendente d'oro lavorato a spirale", caption: "Dettagli di oreficeria" },
];

/** Griglia statica di sei foto con cornice dorata opaca e leggero zoom al passaggio del mouse. */
export default function AtmosphereGallery() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {PHOTOS.map((p) => (
        <li key={p.src}>
          <figure className="group">
            <div className="border border-[#b8925a]/60 p-1.5 transition-colors duration-500 group-hover:border-[#b8925a]">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
            </div>
            <figcaption className="mt-3 font-serif text-lg italic sm:text-xl">{p.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
