import { Banknote, Eye, MapPin, Navigation, Clock } from "lucide-react";
import siteData from "@/data/site-data.json";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const { address, hours } = siteData;
const mapsQuery = encodeURIComponent(`${address.street}, ${address.cap} ${address.city}`);

function IconMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-gold">
      {children}
    </div>
  );
}

export default function TrustGrid() {
  return (
    <section id="negozio" className="scroll-mt-24 bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-gold">Come lavoriamo</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            Dalla stima online al pagamento, senza sorprese
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <IconMark>
                <Eye className="size-5" />
              </IconMark>
              <CardTitle>Bilancia omologata</CardTitle>
              <CardDescription>
                Trasparenza totale: il peso viene rilevato a vista, davanti a te, su bilancia di precisione omologata.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="flex flex-col overflow-hidden md:row-span-1">
            <CardHeader>
              <IconMark>
                <MapPin className="size-5" />
              </IconMark>
              <CardTitle>Sede fisica</CardTitle>
              <CardDescription>
                {address.street}, {address.cap} {address.city}. {address.landmark}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <iframe
                title={`Mappa: ${address.street}, ${address.city}`}
                src={`https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`}
                className="h-48 w-full rounded-lg border border-border"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <Button asChild variant="outline" className="w-full">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation />
                  Indicazioni stradali
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <IconMark>
                <Banknote className="size-5" />
              </IconMark>
              <CardTitle>Pagamento immediato</CardTitle>
              <CardDescription>{siteData.payment}, subito dopo la valutazione.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Clock className="size-4 text-gold" /> Orari
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {hours.map((h) => (
                    <div key={h.days} className="contents">
                      <dt className="text-muted-foreground">{h.days}</dt>
                      <dd className="tabular-nums">{h.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
