"use client";
import { motion, useReducedMotion } from "motion/react";
import { Banknote, Landmark, Scale } from "lucide-react";
import siteData from "@/data/site-data.json";
import { NumberTicker } from "@/components/ui/number-ticker";

const { address, about } = siteData;

/** Statistiche: i valori numerici scorrono quando entrano nel viewport. */
const STATS = [
  { icon: Landmark, prefix: "+", value: about.yearsInBergamo as number | null, text: "", suffix: "", label: "Anni a Bergamo" },
  { icon: Scale, prefix: "", value: null, text: "100%", suffix: "", label: "Pesata a vista" },
  { icon: Banknote, prefix: "", value: null, text: "Subito", suffix: "", label: "Pagamento immediato" },
];

export default function AboutUs() {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        <h2 id="about-title" className="font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl">
          Un punto di riferimento a Bergamo per la stima dell&apos;oro
        </h2>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {about.story ||
            `Da anni nel cuore di Bergamo, in ${address.street}, 123 Gold unisce la massima trasparenza normativa (iscrizione OAM) con la riservatezza di una gioielleria d'alta gamma. Nessuna stima approssimativa: ogni perizia avviene a vista con bilance omologate e sulla quotazione di Borsa aggiornata.`}
        </p>
      </div>

      <ul className="grid grid-cols-3 gap-px border border-[#e2c58f]/70 bg-[#e2c58f]/70 lg:col-span-5">
        {STATS.map(({ icon: Icon, prefix, value, text, suffix, label }, i) => (
          <motion.li
            key={label}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center bg-paper px-3 py-7 text-center"
          >
            <Icon className="size-5 text-gold" strokeWidth={1.5} />
            <div className="mt-3 font-serif text-4xl font-medium leading-none text-foreground md:text-5xl">
              {value === null ? (
                <span className={text.length > 4 ? "text-3xl md:text-4xl" : undefined}>{text}</span>
              ) : (
                <>
                  {prefix}
                  <NumberTicker value={value} className="tracking-tight text-foreground" />
                  {suffix}
                </>
              )}
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
