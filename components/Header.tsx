import { Phone, ShieldCheck } from "lucide-react";
import siteData from "@/data/site-data.json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const { address, contacts } = siteData;

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#" className="flex flex-col leading-none">
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Compro Oro <span className="text-gold">123</span>
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {address.street} · {address.city}
          </span>
        </a>

        <div className="flex items-center gap-3">
          <Badge className="hidden sm:inline-flex border-guarantee/20 bg-guarantee-soft text-guarantee">
            <ShieldCheck /> Iscritto OAM
          </Badge>
          <Button asChild variant="outline">
            <a href={`tel:${contacts.phoneIntl}`}>
              <Phone />
              <span className="hidden sm:inline">{contacts.phone}</span>
              <span className="sm:hidden">Chiama</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
