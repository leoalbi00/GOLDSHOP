"use client";
import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Calculator, MapPin, Banknote, type LucideIcon } from "lucide-react";
import siteData from "@/data/site-data.json";

interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    icon: Calculator,
    title: "Calcola online",
    text: "Scegli caratura e peso: in un attimo vedi la stima e blocchi il prezzo per 24 ore con un voucher QR.",
  },
  {
    icon: MapPin,
    title: "Vieni in Via Maj 39/B",
    text: `Ti aspettiamo in ${siteData.address.street}, a pochi passi dalla Stazione di Bergamo. Mostra il voucher in negozio.`,
  },
  {
    icon: Banknote,
    title: "Pesa e incassa subito",
    text: "Pesatura a vista su bilancia omologata, verifica della caratura e pagamento immediato nei termini di legge.",
  },
];

export default function ProcessTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  return (
    <section id="come-funziona" className="scroll-mt-24 max-w-3xl mx-auto">
      <div className="text-center mb-14">
        <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Come funziona</span>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-1">Tre passaggi, zero sorprese</h2>
      </div>

      <ol ref={ref} className="relative pl-16 md:pl-20 space-y-14">
        <div aria-hidden className="absolute left-6 md:left-8 top-2 bottom-2 w-px bg-zinc-800" />
        <motion.div
          aria-hidden
          style={{ scaleY: progress }}
          className="absolute left-6 md:left-8 top-2 bottom-2 w-px origin-top bg-gradient-to-b from-amber-300 to-amber-600"
        />

        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <motion.div
              className="absolute -left-16 md:-left-20 top-0 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-black text-amber-300 shadow-lg shadow-amber-500/10"
              initial={{ scale: 0.6 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <s.icon className="w-5 h-5 md:w-7 md:h-7" />
            </motion.div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 ml-2">
              <span className="font-mono text-xs text-amber-500">0{i + 1}</span>
              <h3 className="text-xl font-semibold text-white mt-1">{s.title}</h3>
              <p className="text-zinc-400 mt-2">{s.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
