import { DoorClosed, Scale, ShieldCheck } from "lucide-react";
import siteData from "@/data/site-data.json";

const { address, about, trust } = siteData;

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Trasparenza OAM",
    body: "Iscritti al Registro degli Operatori Compro Oro tenuto dall'OAM: ogni acquisto è documentato con scheda cliente e pagamento tracciabile come prevede la legge.",
  },
  {
    icon: Scale,
    title: "Pesata a vista",
    body: "La bilancia omologata è girata verso di te: leggi il peso insieme a noi e ti spieghiamo il conto, grammo per grammo.",
  },
  {
    icon: DoorClosed,
    title: "Perizie riservate",
    body: "Per eredità, orologi e lotti importanti ti riceviamo su appuntamento in un ufficio privato, senza altri clienti presenti.",
  },
];

/** "Chi siamo": solo fatti verificabili. La storia del negozio si scrive in data/site-data.json (about.story). */
export default function AboutSection() {
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="font-serif text-2xl leading-snug text-foreground md:text-3xl">
          {about.story ||
            `123 Gold è il compro oro di ${address.street}, a Bergamo, a pochi minuti dalla Stazione. Valutiamo oro, argento, monete e orologi con un solo metodo: tutto davanti al cliente.`}
        </p>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Calcoli il valore online, blocchi il prezzo per {siteData.pricing.voucherValidityHours} ore e vieni in negozio: pesata a vista, verifica della caratura e
          pagamento immediato. {trust.googleRating.toFixed(1).replace(".", ",")} su 5 su Google, {trust.reviewsLabel}.
        </p>
      </div>
      <ul className="grid gap-px border border-hairline bg-hairline sm:grid-cols-3 lg:col-span-7">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="bg-paper p-6">
            <Icon className="size-6 text-gold" strokeWidth={1.5} />
            <h3 className="mt-4 font-serif text-xl font-medium">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
