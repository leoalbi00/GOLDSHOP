import { Phone } from "lucide-react";
import siteData from "@/data/site-data.json";
import LiveStoreBadge from "@/components/LiveStoreBadge";

const { contacts } = siteData;

const NAV = [
  { href: "#chi-siamo", label: "Chi siamo" },
  { href: "#calcolatore", label: "Calcola" },
  { href: "#recensioni", label: "Recensioni" },
  { href: "#visita", label: "Dove siamo" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <a href="#" className="whitespace-nowrap leading-none" aria-label={`${siteData.name}, torna all'inizio`}>
          <span className="font-serif text-[1.75rem] font-medium tracking-tight text-foreground">
            Compro Oro <span className="italic text-gold">123</span>
          </span>
        </a>

        <nav aria-label="Sezioni" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <LiveStoreBadge className="hidden sm:inline-flex" />
          <a
            href={`tel:${contacts.phoneIntl}`}
            className="inline-flex items-center gap-2 whitespace-nowrap border border-foreground px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <Phone className="size-3.5" />
            <span className="hidden tabular-nums sm:inline">{contacts.phone}</span>
            <span className="sm:hidden">Chiama</span>
          </a>
        </div>
      </div>
    </header>
  );
}
