"use client";
import { useEffect, useRef } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Tiene ScrollTrigger allineato alla posizione interpolata da Lenis. */
function ScrollTriggerSync() {
  useLenis(ScrollTrigger.update);
  return null;
}

/**
 * Scroll a inerzia su tutta la pagina. Lenis è guidato dal ticker di GSAP,
 * così ScrollTrigger e le animazioni leggono la stessa posizione nello stesso frame.
 * Con prefers-reduced-motion Lenis torna allo scroll nativo (respectReducedMotion, default).
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    // L'istanza Lenis nasce dopo il primo render: va letta dal ref a ogni frame.
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -96 } }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
