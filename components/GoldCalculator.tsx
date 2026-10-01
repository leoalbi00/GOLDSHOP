"use client";
import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import siteData from "@/data/site-data.json";
import { PURITIES, estimatePayout, formatEur, spotPerGram } from "@/lib/pricing";
import { useQuotes } from "@/lib/useQuotes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VoucherLockModal, { type VoucherData } from "@/components/VoucherLockModal";

const TAB_IDS = ["18K", "24K", "14K", "AG"];
const TABS = TAB_IDS.map((id) => PURITIES.find((p) => p.id === id)!);
const FINENESS_LABEL: Record<string, string> = { "18K": "750", "24K": "999", "14K": "585", AG: "999" };
const MAX_GRAMS = 5000;

/** Accetta sia "15,5" che "15.5"; restituisce null se non valido. */
function parseGrams(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 && n <= MAX_GRAMS ? n : null;
}

export default function GoldCalculator() {
  const { gold24k, silver } = useQuotes();
  const [purityId, setPurityId] = useState("18K");
  const [rawGrams, setRawGrams] = useState("15");
  const [voucher, setVoucher] = useState<VoucherData | null>(null);

  const purity = TABS.find((p) => p.id === purityId) ?? TABS[0];
  const grams = parseGrams(rawGrams);
  const payout = useMemo(
    () => (grams ? estimatePayout(purity, grams, gold24k, silver) : null),
    [purity, grams, gold24k, silver],
  );
  const spot = spotPerGram(purity, gold24k, silver).toNumber();
  const invalid = rawGrams.trim() !== "" && grams === null;

  return (
    <Card id="calcolatore" className="scroll-mt-28 shadow-md">
      <CardHeader className="border-b border-border">
        <CardTitle>Stima il valore del tuo oro</CardTitle>
        <CardDescription>Calcolo sulla quotazione indicativa, aggiornata ogni minuto.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <span className="text-sm font-medium">Metallo e caratura</span>
          <Tabs value={purityId} onValueChange={setPurityId}>
            <TabsList>
              {TABS.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>
                  <span className="font-semibold">{p.id === "AG" ? "Argento" : p.id}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">{FINENESS_LABEL[p.id]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <label htmlFor="grams" className="text-sm font-medium">
            Peso in grammi
          </label>
          <div className="relative">
            <Input
              id="grams"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="es. 15"
              value={rawGrams}
              onChange={(e) => setRawGrams(e.target.value.replace(/[^\d.,]/g, ""))}
              aria-invalid={invalid}
              aria-describedby="grams-help"
              className="h-12 pr-10 text-lg font-semibold tabular-nums aria-[invalid=true]:border-rose-400"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">g</span>
          </div>
          <p id="grams-help" className={invalid ? "text-xs text-rose-600" : "text-xs text-muted-foreground"}>
            {invalid ? `Inserisci un peso tra 0,1 e ${MAX_GRAMS} g.` : `Quotazione ${purity.label}: ${formatEur(spot)}/g`}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stima netta</div>
          <div aria-live="polite" className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-guarantee">
            {payout ? formatEur(payout) : "—"}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Valore indicativo, confermato in negozio dopo pesatura e verifica della caratura.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!payout || !grams}
          onClick={() =>
            payout &&
            grams &&
            setVoucher({ purity, grams, amount: formatEur(payout), issuedAt: new Date() })
          }
        >
          <Lock />
          Blocca questa quotazione (Valida {siteData.pricing.voucherValidityHours}h)
        </Button>
      </CardContent>

      <VoucherLockModal voucher={voucher} onClose={() => setVoucher(null)} />
    </Card>
  );
}
