"use client";
import { Calculator } from "lucide-react";
import siteData from "@/data/site-data.json";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SimpleGoldCalculator from "@/components/SimpleGoldCalculator";

const { pricing, payment, services, hours, compliance } = siteData;

const FAQ = [
  {
    q: "Quali documenti devo portare?",
    a: "Un documento d'identità valido e il codice fiscale. Per legge (D.Lgs. 92/2017) ogni acquisto di oro usato richiede l'identificazione del cliente e la compilazione di una scheda.",
  },
  {
    q: "Come calcolate il prezzo?",
    a: "Partiamo dalla quotazione di Borsa del giorno, la moltiplichiamo per il titolo (ad esempio 750 per l'oro 18K) e per il peso netto, e togliamo il margine del negozio, che vedi già indicato nel calcolatore. In negozio pesiamo davanti a te e verifichiamo la caratura.",
  },
  {
    q: "Come vengo pagato?",
    a: `${payment}. Per importi da ${compliance.cashLimitEur} € in su la legge consente solo pagamenti tracciabili: bonifico o assegno.`,
  },
  {
    q: `Cosa significa bloccare il prezzo per ${pricing.voucherValidityHours} ore?`,
    a: `Ricevi un voucher con codice e QR: per ${pricing.voucherValidityHours} ore il prezzo al grammo resta quello del momento, anche se la quotazione scende. Il valore finale si conferma in negozio dopo la pesata e la verifica del titolo.`,
  },
  {
    q: "Cosa acquistate?",
    a: services.join(" · "),
  },
  {
    q: "Serve un appuntamento?",
    a: `No, negli orari di apertura (${hours.map((h) => `${h.days}: ${h.hours}`).join("; ")}). Per eredità, orologi o lotti importanti consigliamo un appuntamento riservato.`,
  },
];

/** Calcolatore e domande frequenti in un'unica sezione compatta; il calcolatore parte aperto. */
export default function AccordionCalculator() {
  return (
    <Accordion type="multiple" defaultValue={["calcolatore"]} className="border-t border-hairline">
      <AccordionItem value="calcolatore">
        <AccordionTrigger>
          <span className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center bg-gold text-white">
              <Calculator className="size-6" strokeWidth={1.5} />
            </span>
            <span>
              <span className="block font-serif text-2xl font-medium md:text-3xl">Sai quanti grammi hai?</span>
              <span className="block text-sm text-muted-foreground">Calcola in tempo reale e blocca il prezzo per {pricing.voucherValidityHours} ore</span>
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <SimpleGoldCalculator />
        </AccordionContent>
      </AccordionItem>

      <div className="pt-10 text-xs font-semibold uppercase tracking-[0.24em] text-gold">Domande frequenti</div>
      {FAQ.map((f, i) => (
        <AccordionItem key={f.q} value={`faq-${i}`}>
          <AccordionTrigger className="font-serif text-xl font-medium">{f.q}</AccordionTrigger>
          <AccordionContent className="max-w-3xl leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
