import TradingViewChart from "@/components/TradingViewChart";
import RevealTitle from "@/components/RevealTitle";

export default function MarketSection() {
  return (
    <section id="mercato" aria-labelledby="mercato-title" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">N° 01 — Mercato</div>
          <RevealTitle
            id="mercato-title"
            className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl"
            segments={["La quotazione,", { text: "senza filtri.", className: "italic" }]}
          />
          <p className="mt-6 max-w-sm leading-relaxed text-muted-foreground">
            Lo stesso riferimento che usiamo al banco: oro fino 24K in euro al grammo. Passa il cursore sul grafico
            per leggere valore e orario esatti.
          </p>
        </div>
        <div className="lg:col-span-8">
          <TradingViewChart />
        </div>
      </div>
    </section>
  );
}
