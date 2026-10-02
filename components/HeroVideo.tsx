"use client";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ShieldCheck } from "lucide-react";

/**
 * Hero istituzionale con video di sfondo (Mixkit, licenza gratuita, 720p senza audio, ~650 KB).
 * Con prefers-reduced-motion il video resta fermo sul poster e i testi compaiono senza animazione.
 */
export default function HeroVideo() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reduce) v.pause();
    else void v.play().catch(() => undefined);
  }, [reduce]);

  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section ref={sectionRef} className="relative isolate flex min-h-[80svh] items-end overflow-hidden bg-foreground text-white">
      <motion.div style={{ y: videoY }} className="absolute inset-0 -z-10">
        <video
          ref={videoRef}
          className="h-full w-full scale-105 object-cover"
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
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b0f17]/95 via-[#0b0f17]/65 to-[#0b0f17]/40" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:pb-28">
        <motion.div {...fade(0)}>
          <span className="inline-flex items-center gap-2 border border-[#e2c58f]/50 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide backdrop-blur-md">
            <ShieldCheck className="size-4 text-[#e2c58f]" /> Iscrizione Registro Operatori Compro Oro OAM
          </span>
        </motion.div>

        <motion.h1
          {...fade(0.15)}
          className="mt-8 font-serif text-[clamp(3.25rem,9vw,7.5rem)] font-medium leading-[0.95] tracking-[-0.02em]"
        >
          123 <span className="italic text-[#e2c58f]">Gold</span> — Bergamo
        </motion.h1>

        <motion.p {...fade(0.3)} className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
          Compro Oro e Quotazioni Preziosi <span className="mx-2 text-[#e2c58f]">|</span> Via Angelo Maj 39/B
        </motion.p>

        <motion.div {...fade(0.45)} className="mt-10 flex flex-wrap gap-3">
          <a
            href="#calcolatore"
            className="inline-flex h-13 items-center bg-[#e2c58f] px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-[#f0dcae]"
          >
            Stima indicativa
          </a>
          <a
            href="#contatti"
            className="inline-flex h-13 items-center border border-white/40 px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-foreground"
          >
            Contatti e orari
          </a>
        </motion.div>
      </div>
    </section>
  );
}
