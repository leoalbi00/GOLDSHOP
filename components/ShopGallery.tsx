import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/** Foto reali della sede in public/images/shop/ (vedi il README nella cartella). */
export const SHOP_PHOTOS = [
  { file: "front-store.jpg", alt: "Insegna e ingresso di 123 Gold in Via Angelo Maj 39/B, Bergamo", caption: "La nostra sede a Bergamo" },
  { file: "interior-scale.jpg", alt: "Bilancia omologata con il display rivolto al cliente", caption: "Bilancia omologata a vista OAM" },
  { file: "vip-office.jpg", alt: "Salotto di accoglienza per la stima", caption: "Il salotto di accoglienza e stima" },
];

/** Solo le foto davvero presenti: il controllo avviene al build, la pagina resta statica. */
export function availableShopPhotos() {
  const dir = path.join(process.cwd(), "public", "images", "shop");
  return SHOP_PHOTOS.filter((p) => fs.existsSync(path.join(dir, p.file)));
}

export default function ShopGallery({ photos }: { photos: typeof SHOP_PHOTOS }) {
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {photos.map((p) => (
        <li key={p.file}>
          <figure>
            <div className="border border-[#b8925a]/60 p-1.5">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={`/images/shop/${p.file}`}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption className="mt-3 font-serif text-xl italic text-foreground">{p.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
