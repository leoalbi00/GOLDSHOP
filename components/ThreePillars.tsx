"use client";
import { motion, useReducedMotion } from "motion/react";
import { Armchair, MapPin, Scale, type LucideIcon } from "lucide-react";
import siteData from "@/data/site-data.json";
import gallery from "@/data/gallery.json";

const { address } = siteData;
const photos = gallery.photos as { src: string; alt: string; caption: string }[];

/** Foto reale per lo slot di data/gallery.json (stesso percorso dell'esempio), se è stata caricata. */
function photoFor(slotId: string) {
  const slot = gallery.slots.find((s) => s.id === slotId);
  return slot ? photos.find((p) => p.src === slot.example) : undefined;
}

const PILLARS: { slot: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    slot: "bilancia",
    icon: Scale,
    title: "Bilancia omologata a vista",
    body: "Il display è rivolto verso di te: leggi il peso insieme a noi. Ogni operazione è registrata secondo le regole del Registro OAM.",
  },
  {
    slot: "salotto",
    icon: Armchair,
    title: "Salotto VIP riservato",
    body: "Per eredità e lotti importanti la perizia avviene in una sala privata, lontano dal banco e senza fretta.",
  },
  {
    slot: "insegna",
    icon: MapPin,
    title: "A due passi dalla Stazione",
    body: `${address.street}, nel centro di Bergamo: ${address.landmark.charAt(0).toLowerCase()}${address.landmark.slice(1)}.`,
  },
];

/** I tre pilastri del negozio, ognuno con la sua foto reale (o una cornice dorata finché la foto manca). */
export default function ThreePillars() {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {PILLARS.map(({ slot, icon: Icon, title, body }, i) => {
        const photo = photoFor(slot);
        return (
          <motion.li
            key={slot}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="group overflow-hidden rounded-2xl border border-hairline bg-paper"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#f5e6b8,#e2c58f_45%,#b8925a)]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Icon className="size-16 text-foreground/70" strokeWidth={1} aria-hidden />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-gold-soft text-gold">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <h3 className="font-serif text-2xl font-medium leading-tight">{title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
