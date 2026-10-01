import { Banknote, MapPin, Scale, Star } from "lucide-react";
import siteData from "@/data/site-data.json";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const { address, trust, links, payment, pricing } = siteData;

/** Display di bilancia stilizzato: il peso si legge insieme al cliente. */
function ScaleReadout() {
  return (
    <div className="absolute right-6 top-6 hidden w-64 border border-hairline bg-foreground p-4 text-background shadow-sm sm:block" aria-hidden>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-background/50">
        <span>Bilancia omologata</span>
        <span className="size-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="mt-3 text-right font-mono text-4xl tabular-nums tracking-tight">
        15,00<span className="ml-1 text-lg text-background/60">g</span>
      </div>
      <div className="mt-2 h-px bg-background/15" />
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.16em] text-background/50">
        <span>Tara 0,00</span>
        <span>Stabile</span>
      </div>
    </div>
  );
}

/** Pianta stilizzata della zona: Stazione FS → Via Angelo Maj. */
function AreaSketch() {
  return (
    <svg viewBox="0 0 300 220" className="absolute inset-x-0 top-0 hidden h-56 w-full text-hairline lg:block" aria-hidden>
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <path d="M-10 160 L310 120" />
        <path d="M-10 60 L310 90" />
        <path d="M80 -10 L120 230" />
        <path d="M200 -10 L180 230" />
        <path d="M-10 200 L310 185" strokeDasharray="4 4" />
      </g>
      <path d="M40 196 C 90 170, 130 140, 186 108" stroke="#92400e" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
      <rect x="22" y="188" width="36" height="14" fill="#111827" />
      <text x="40" y="198" fill="#faf9f6" fontSize="7" textAnchor="middle" fontFamily="sans-serif">FS</text>
      <circle cx="186" cy="108" r="10" fill="#92400e" opacity="0.15" />
      <circle cx="186" cy="108" r="4" fill="#92400e" />
    </svg>
  );
}

function PaymentGlyph() {
  return (
    <div className="absolute right-6 top-6 hidden gap-2 sm:flex" aria-hidden>
      {["Bonifico", "Contanti*"].map((m) => (
        <span key={m} className="border border-hairline bg-paper px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {m}
        </span>
      ))}
    </div>
  );
}

const CARDS = [
  {
    name: "Pesata a vista, operatore OAM",
    description:
      "Pesiamo il tuo oro davanti a te su bilancia di precisione omologata. Siamo iscritti al Registro Compro Oro OAM: ogni operazione è documentata.",
    Icon: Scale,
    href: "#calcolatore",
    cta: "Stima il tuo oro",
    background: <ScaleReadout />,
    className: "lg:col-span-2",
  },
  {
    name: "Sede di Bergamo Centro",
    description: `${address.street}, ${address.cap} ${address.city}. ${address.landmark}.`,
    Icon: MapPin,
    href: "#visita",
    cta: "Indicazioni stradali",
    background: <AreaSketch />,
    className: "lg:row-span-2",
  },
  {
    name: "Pagamento immediato",
    description: `${payment}, subito dopo la valutazione. Con il voucher online il prezzo resta bloccato per ${pricing.voucherValidityHours} ore.`,
    Icon: Banknote,
    href: "#calcolatore",
    cta: "Blocca il prezzo",
    background: <PaymentGlyph />,
    className: "lg:col-span-2",
  },
];

export default function TrustAndReviews() {
  return (
    <div>
      <BentoGrid className="auto-rows-[20rem] lg:grid-cols-3">
        {CARDS.map((c) => (
          <BentoCard
            key={c.name}
            {...c}
            className={`col-span-3 rounded-sm border border-hairline bg-paper lg:col-span-1 ${c.className}`}
          />
        ))}
      </BentoGrid>

      <a
        href={links.googleReviews}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-4 fill-gold text-gold" />
          ))}
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">{trust.googleRating.toFixed(1).replace(".", ",")}</span> su
          Google · {trust.reviewsLabel} →
        </span>
      </a>
      <p className="mt-2 text-xs text-muted-foreground">
        * Contanti solo per importi inferiori a {siteData.compliance.cashLimitEur} €, come previsto per i compro oro.
      </p>
    </div>
  );
}
