"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import gallery from "@/data/gallery.json";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

interface Photo {
  src: string;
  alt: string;
  caption: string;
}

const photos = gallery.photos as Photo[];
const isDev = process.env.NODE_ENV !== "production";
/** Spostamento massimo dell'immagine dentro la cornice durante lo scorrimento. */
const PARALLAX = 0.18;

/**
 * Slider Embla con parallasse sulle immagini e cornice dorata all'hover.
 * Mostra solo foto reali da data/gallery.json; in sviluppo, senza foto, mostra le cornici da riempire.
 */
export default function ShopGallery() {
  const reduce = useReducedMotion();
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "center", skipSnaps: false });
  const layers = useRef<(HTMLImageElement | null)[]>([]);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState<Photo | null>(null);

  const parallax = useCallback(
    (api: EmblaCarouselType) => {
      if (reduce) return;
      const progress = api.scrollProgress();
      api.scrollSnapList().forEach((snap, i) => {
        let diff = snap - progress;
        // Con il loop la distanza va presa sul lato più corto.
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;
        const el = layers.current[i];
        if (el) el.style.transform = `translateX(${diff * -100 * PARALLAX}%) scale(1.2)`;
      });
    },
    [reduce],
  );

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    parallax(embla);
    onSelect();
    embla.on("scroll", parallax).on("reInit", parallax).on("select", onSelect);
    return () => {
      embla.off("scroll", parallax).off("reInit", parallax).off("select", onSelect);
    };
  }, [embla, parallax]);

  if (!photos.length) {
    if (!isDev) return null;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {photos.map((p, i) => (
            <div key={p.src} className="min-w-0 shrink-0 grow-0 basis-[85%] px-2 sm:basis-[60%] lg:basis-[42%]">
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="group relative block aspect-[4/5] w-full overflow-hidden bg-muted text-left"
                aria-label={`Ingrandisci: ${p.caption}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={(el) => {
                    layers.current[i] = el;
                  }}
                  src={p.src}
                  alt={p.alt}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-500 group-hover:brightness-110"
                  style={{ transform: "scale(1.2)" }}
                />
                {/* Cornice dorata che si accende all'hover */}
                <span className="pointer-events-none absolute inset-3 border border-[#e2c58f]/0 transition-[inset,border-color] duration-500 group-hover:inset-4 group-hover:border-[#e2c58f]" />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 font-serif text-xl text-white transition-transform duration-500 group-hover:translate-y-0">
                  {p.caption}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2" role="tablist" aria-label="Foto">
          {photos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              role="tab"
              aria-selected={selected === i}
              aria-label={p.caption}
              onClick={() => embla?.scrollTo(i)}
              className={cn("h-1 rounded-full transition-all", selected === i ? "w-10 bg-gold" : "w-4 bg-hairline")}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => embla?.scrollPrev()} className="flex size-11 items-center justify-center border border-[#b8925a]/60 hover:bg-gold-soft" aria-label="Foto precedente">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} className="flex size-11 items-center justify-center border border-[#b8925a]/60 hover:bg-gold-soft" aria-label="Foto successiva">
            <ChevronRight className="size-5" />
          </button>
        </div>
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
    </div>
  );
}
