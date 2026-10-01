"use client";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, MapPin, Scale, ShieldCheck } from "lucide-react";
import siteData from "@/data/site-data.json";

const TITLE = "Valutazione Oro in Tempo Reale a Bergamo";
const { address, trust } = siteData;

/**
 * Hero a tutto schermo con video di sfondo (Mixkit, licenza gratuita, 720p senza audio, ~650 KB).
 * Con prefers-reduced-motion il video resta fermo sul poster e il titolo compare senza animazione.
 */
export default function HeroVideo() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reduce) v.pause();
    else void v.play().catch(() => undefined);
  }, [reduce]);

  const words = TITLE.split(" ");
  let index = 0;

  return (
    <section ref={sectionRef} className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-foreground text-white">
      <motion.div style={{ y: videoY }} className="absolute inset-0 -z-10">
        <video
          ref={videoRef}
          className="h-full w-full scale-105 object-cover blur-[2px]"
          src="/videos/hero-gold.mp4"
          poster="/videos/hero-gold-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b0f17]/95 via-[#0b0f17]/60 to-[#0b0f17]/35" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_100%,rgba(146,64,14,0.35),transparent_60%)]" />

      <motion.div style={{ opacity: contentOpacity }} className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:pb-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md">
            <ShieldCheck className="size-3.5 text-emerald-300" /> Iscritto Registro OAM
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md">
            <Scale className="size-3.5 text-[#e2c58f]" /> Bilancia omologata
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md">
            ★ {trust.googleRating.toFixed(1).replace(".", ",")} su Google
          </span>
        </motion.div>

        <h1
          aria-label={TITLE}
          className="mt-8 max-w-5xl text-balance font-serif text-[clamp(2.75rem,7.5vw,6.5rem)] font-medium leading-[0.98] tracking-[-0.02em]"
        >
          {words.map((word, w) => (
            <span key={w} aria-hidden className="inline-block whitespace-nowrap">
              {[...word].map((ch) => {
                const i = index++;
                return (
                  <motion.span
                    key={i}
                    className={`inline-block ${word === "Oro" ? "italic text-[#e2c58f]" : ""}`}
                    initial={reduce ? false : { opacity: 0, y: "0.4em", filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.5, delay: 0.25 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
              {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 + TITLE.length * 0.03 }}
          className="mt-6 flex max-w-2xl items-start gap-2 text-lg leading-relaxed text-white/80 md:text-xl"
        >
          <MapPin className="mt-1.5 size-5 shrink-0 text-[#e2c58f]" />
          <span>
            <strong className="font-semibold text-white">{address.street}</strong> — Bilancia omologata a vista e pagamento
            immediato
          </span>
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 + TITLE.length * 0.03 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#calcolatore"
            className="inline-flex h-14 items-center gap-2 bg-[#e2c58f] px-7 text-sm font-bold uppercase tracking-[0.12em] text-foreground shadow-[0_4px_0_0_#92400e] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none"
          >
            Calcola il valore <ArrowDown className="size-4" />
          </a>
          <a
            href="#visita"
            className="inline-flex h-14 items-center gap-2 border border-white/40 px-7 text-sm font-semibold uppercase tracking-[0.12em] backdrop-blur-sm transition-colors hover:bg-white hover:text-foreground"
          >
            Dove siamo
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
