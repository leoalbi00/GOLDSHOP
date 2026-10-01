"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import siteData from "@/data/site-data.json";
import GoldCalculator from "@/components/GoldCalculator";

const { address, contacts, trust } = siteData;
const waNumber = contacts.whatsapp.replace(/\D/g, "");

const HEADLINE = ["Vendi", "il", "tuo", "oro", "a", "Bergamo"];

export default function HeroParallax() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "40%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Fondale: bagliore oro + griglia ardesia con parallasse */}
      <motion.div aria-hidden style={{ y: glowY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-slate-500/15 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b33_1px,transparent_1px),linear-gradient(to_bottom,#1e293b33_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pt-14 pb-20 md:pt-20 md:pb-28 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-200"
          >
            <MapPin className="w-3.5 h-3.5" />
            {address.street} · zona Stazione Bergamo
          </motion.div>

          <h1 className="mt-6 font-serif text-5xl md:text-7xl font-bold leading-[1.05]">
            <span className="sr-only">{HEADLINE.join(" ")} al giusto valore</span>
            <span aria-hidden className="block">
              {HEADLINE.map((w, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.25em] bg-gradient-to-b from-slate-100 to-slate-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                </motion.span>
              ))}
            </span>
            <motion.span
              aria-hidden
              className="block bg-[linear-gradient(110deg,#b45309,#fcd34d_35%,#fffbeb_50%,#fcd34d_65%,#b45309)] bg-[length:200%_100%] bg-clip-text text-transparent"
              initial={{ opacity: 0, backgroundPosition: "100% 0" }}
              animate={{ opacity: 1, backgroundPosition: ["100% 0", "0% 0"] }}
              transition={{
                opacity: { delay: 0.7, duration: 0.6 },
                backgroundPosition: { delay: 0.7, duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
              }}
            >
              al giusto valore
            </motion.span>
          </h1>

          <motion.p
            className="mt-6 max-w-xl text-lg text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Calcola la stima in pochi secondi, blocca il prezzo per 24 ore e passa in negozio: pesatura a vista su
            bilancia omologata e pagamento immediato.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15 }}
          >
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-6 py-3.5 font-semibold text-emerald-300 hover:bg-emerald-500/10"
            >
              <MessageCircle className="w-5 h-5" />
              Scrivici su WhatsApp
            </a>
            <a
              href="#come-funziona"
              className="flex items-center justify-center rounded-xl border border-zinc-700 px-6 py-3.5 font-semibold text-zinc-200 hover:border-zinc-500"
            >
              Come funziona
            </a>
          </motion.div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {trust.googleRating.toFixed(1)} su Google · {trust.reviewsLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {trust.legalNotes[0]}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <GoldCalculator />
        </motion.div>
      </div>
    </section>
  );
}
