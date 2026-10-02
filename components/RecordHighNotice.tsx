"use client";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import { useQuotes } from "@/lib/useQuotes";

const { allTimeHigh } = siteData.pricing;

/** Piccolo avviso in cima alla pagina, visibile solo quando l'oro 24K è pari o sopra il massimo storico registrato. */
export default function RecordHighNotice() {
  const { gold24k } = useQuotes();
  if (gold24k < allTimeHigh.gold24kEurPerGram) return null;

  return (
    <a
      href="#contatti"
      className="block bg-foreground px-4 py-2.5 text-center text-xs text-background/80 transition-colors hover:text-background sm:text-sm"
    >
      <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-[#e2c58f] align-middle motion-reduce:animate-none" aria-hidden />
      <strong className="font-semibold text-[#e2c58f]">L&apos;oro è al massimo storico</strong>
      <span className="mx-2 opacity-40">·</span>
      {formatEur(gold24k)}/g (24K)
      <span className="mx-2 opacity-40">·</span>
      <span className="underline-offset-4 hover:underline">Valutazione gratuita in Via Angelo Maj 39/B →</span>
    </a>
  );
}
