"use client";
import { Fragment, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Segment = string | { text: string; className?: string };

interface Props {
  id?: string;
  as?: "h1" | "h2";
  segments: Segment[];
  className?: string;
  /** "load": all'ingresso in pagina; "scroll": quando il titolo entra nel viewport. */
  trigger?: "load" | "scroll";
}

/**
 * Titolo con rivelazione parola per parola: ogni parola sale da una maschera.
 * Il testo resta nel DOM come frase intera per screen reader e SEO.
 */
export default function RevealTitle({ id, as: Tag = "h2", segments, className, trigger = "scroll" }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".reveal-word", {
        yPercent: 110,
        rotate: 2,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.06,
        delay: trigger === "load" ? 0.15 : 0,
        scrollTrigger: trigger === "scroll" ? { trigger: ref.current, start: "top 85%", once: true } : undefined,
      });
    },
    { scope: ref },
  );

  const words = segments.flatMap((s) => {
    const { text, className: cls } = typeof s === "string" ? { text: s, className: undefined } : s;
    return text.split(/\s+/).filter(Boolean).map((w) => ({ w, cls }));
  });
  const label = words.map((x) => x.w).join(" ");

  return (
    <Tag id={id} ref={ref} className={className} aria-label={label}>
      {words.map(({ w, cls }, i) => (
        <Fragment key={i}>
          <span aria-hidden className="reveal-line">
            <span className={`reveal-word ${cls ?? ""}`}>{w}</span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}
