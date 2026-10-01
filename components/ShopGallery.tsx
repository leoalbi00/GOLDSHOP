"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ImageIcon } from "lucide-react";
import gallery from "@/data/gallery.json";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Photo {
  src: string;
  alt: string;
  caption: string;
}

const photos = gallery.photos as Photo[];
const isDev = process.env.NODE_ENV !== "production";

/**
 * Galleria del negozio: griglia su desktop, scorrimento orizzontale su mobile, foto intera al clic.
 * Mostra solo foto reali da data/gallery.json; in sviluppo, senza foto, mostra le cornici da riempire.
 */
export default function ShopGallery() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<Photo | null>(null);

  if (!photos.length) {
    if (!isDev) return null;
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {gallery.slots.map((s) => (
          <div key={s.id} className="flex aspect-[4/5] flex-col items-center justify-center gap-3 border-2 border-dashed border-hairline p-6 text-center text-sm text-muted-foreground">
            <ImageIcon className="size-8" strokeWidth={1.2} />
            <span className="font-medium text-foreground">{s.caption}</span>
            <span className="text-xs">Solo in sviluppo: aggiungi {s.example} e la voce in data/gallery.json</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0" data-lenis-prevent-touch>
        {photos.map((p, i) => (
          <motion.button
            key={p.src}
            type="button"
            onClick={() => setOpen(p)}
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative aspect-[4/5] w-[80%] shrink-0 snap-center overflow-hidden border border-hairline bg-muted text-left md:w-auto ${
              i === 0 ? "md:col-span-2 md:aspect-auto md:row-span-2" : ""
            }`}
            aria-label={`Ingrandisci: ${p.caption}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 font-serif text-lg text-white">{p.caption}</span>
          </motion.button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <DialogContent className="block rounded-sm p-2 sm:max-w-4xl">
            <DialogTitle className="sr-only">{open.caption}</DialogTitle>
            <DialogDescription className="sr-only">{open.alt}</DialogDescription>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.src} alt={open.alt} className="max-h-[80vh] w-full object-contain" />
            <p className="px-2 py-3 font-serif text-lg">{open.caption}</p>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
