"use client";
import siteData from "@/data/site-data.json";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SimpleGoldCalculator from "@/components/SimpleGoldCalculator";

const { pricing, payment, compliance, address } = siteData;

function Title({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <span className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center border border-[#e2c58f] bg-gold-soft text-2xl" aria-hidden>
        {emoji}
      </span>
      <span>
        <span className="block font-serif text-2xl font-medium leading-tight md:text-3xl">{title}</span>
        {sub && <span className="mt-1 block text-sm text-muted-foreground">{sub}</span>}
      </span>
    </span>
  );
}

const STEPS_OAM = [
  ["Identificazione", "Ti chiediamo un documento d'identità valido e il codice fiscale: è un obbligo di legge (D.Lgs. 92/2017) per ogni acquisto di oro usato."],
  ["Pesata a vista", "La bilancia omologata è rivolta verso di te: leggi il peso insieme a noi, prima di qualsiasi calcolo."],
  ["Verifica del titolo", "Controlliamo punzoni e caratura (es. 750 per l'oro 18K) davanti a te, e ti spieghiamo quanto oro puro contiene l'oggetto."],
  ["Scheda e pagamento", `Compiliamo la scheda cliente prevista dal Registro OAM e paghiamo subito: ${payment.toLowerCase()}. Da ${compliance.cashLimitEur} € in su solo bonifico o assegno.`],
];

const STEPS_LOCK = [
  ["Calcola", "Inserisci i grammi e scegli la caratura nel calcolatore qui sopra: vedi subito la stima netta."],
  ["Blocca", `Premi "Blocca il Prezzo per 24h": ricevi un certificato con codice e QR, valido ${pricing.voucherValidityHours} ore.`],
  ["Invia su WhatsApp", "Con un tocco mandi il voucher al negozio: il prezzo al grammo resta quello del momento, anche se la quotazione scende."],
  ["Vieni in sede", `Entro ${pricing.voucherValidityHours} ore passi in ${address.street}: pesata a vista e pagamento. Il valore finale si conferma dopo la verifica di peso e titolo.`],
];

function Steps({ steps }: { steps: string[][] }) {
  return (
    <ol className="grid gap-px border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-4">
      {steps.map(([title, body], i) => (
        <li key={title} className="bg-paper p-5">
          <div className="font-serif text-3xl italic text-gold">{i + 1}</div>
          <div className="mt-2 font-semibold">{title}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Tre tendine: il calcolatore (aperto), la pesata a vista con la trasparenza OAM, il blocco del prezzo. */
export default function AccordionCalculator() {
  return (
    <Accordion type="multiple" defaultValue={["calcolatore"]} className="border-t border-hairline">
      <AccordionItem value="calcolatore">
        <AccordionTrigger>
          <Title emoji="🧮" title="Sai quanti grammi hai?" sub="Calcola in tempo reale il valore del tuo oro" />
        </AccordionTrigger>
        <AccordionContent>
          <SimpleGoldCalculator />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="oam">
        <AccordionTrigger>
          <Title emoji="⚖️" title="Come funziona la pesata a vista e la trasparenza OAM?" />
        </AccordionTrigger>
        <AccordionContent>
          <Steps steps={STEPS_OAM} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="blocco">
        <AccordionTrigger>
          <Title emoji="🔒" title={`Blocco quotazione per ${pricing.voucherValidityHours} ore`} sub="Come bloccare il prezzo di oggi prima di venire in negozio" />
        </AccordionTrigger>
        <AccordionContent>
          <Steps steps={STEPS_LOCK} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
