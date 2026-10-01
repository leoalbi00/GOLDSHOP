"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Spostamento verticale massimo del parallasse in px (0 = nessun parallasse). */
  parallax?: number;
  delay?: number;
}

/**
 * Comparsa dal basso (slide-up + fade-in) quando la sezione entra nel viewport, più un leggero parallasse
 * legato allo scroll. Funziona con Lenis perché Lenis muove lo scroll nativo, che useScroll legge.
 */
export default function ScrollReveal({ children, className, parallax = 40, delay = 0 }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [parallax, -parallax]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
