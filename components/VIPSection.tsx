import { ArrowRight, DoorClosed, FileCheck2, Watch } from "lucide-react";
import RevealTitle from "@/components/RevealTitle";
import VIPBookingModal from "@/components/VIPBookingModal";

const POINTS = [
  { icon: DoorClosed, title: "Ufficio privato", body: "Valutazione a porta chiusa, senza altri clienti presenti." },
  { icon: Watch, title: "Lotti importanti", body: "Eredità, orologi di pregio, lingotti, monete e quantitativi elevati." },
  { icon: FileCheck2, title: "Tutto tracciato", body: "Scheda di legge, pagamento tracciabile e documentazione completa." },
];

export default function VIPSection() {
  return (
    <section id="riservato" aria-labelledby="riservato-title" className="scroll-mt-24 border-b border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-6">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#d6b37a]">N° 03 — Riservato</div>
          <RevealTitle
            id="riservato-title"
            className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl"
            segments={["Per ciò che conta,", { text: "un appuntamento privato.", className: "italic text-[#d6b37a]" }]}
          />
          <p className="mt-6 max-w-md leading-relaxed text-background/65">
            Scegli giorno e orario: ti riceviamo nel nostro ufficio riservato in Via Angelo Maj, con il tempo che serve
            per valutare ogni pezzo.
          </p>
          <VIPBookingModal>
            <button
              type="button"
              className="group mt-10 inline-flex h-14 items-center gap-3 bg-background px-7 text-sm font-semibold uppercase tracking-[0.14em] text-foreground shadow-[0_4px_0_0_#d6b37a] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none"
            >
              Prenota la valutazione
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </VIPBookingModal>
        </div>

        <ul className="divide-y divide-background/10 border-y border-background/10 lg:col-span-6 lg:self-end">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-5 py-6">
              <Icon className="mt-0.5 size-5 shrink-0 text-[#d6b37a]" strokeWidth={1.5} />
              <div>
                <div className="font-semibold">{title}</div>
                <p className="mt-1 text-sm text-background/60">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
