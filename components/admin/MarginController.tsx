"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { PURITIES, formatEur, offerPerGram, spotPerGram } from "@/lib/pricing";
import { DEFAULT_MARGINS, spreadFor, type MarginSettings } from "@/lib/margins";
import { useQuotes } from "@/lib/useQuotes";
import { useMargins } from "@/lib/useMargins";
import { MARGINS_WRITE_URL, apiError } from "@/lib/useAdminData";

const pct = new Intl.NumberFormat("it-IT", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const toInput = (n: number) => n.toFixed(2).replace(".", ",");
const parse = (s: string) => {
  const n = Number(s.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** Spread €/g per caratura: ciò che si salva qui è subito il prezzo mostrato nel calcolatore pubblico. */
export default function MarginController() {
  const { gold24k, silver } = useQuotes();
  const { settings, mutate } = useMargins();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(Object.fromEntries(PURITIES.map((p) => [p.id, toInput(spreadFor(settings, p.id))])));
  }, [settings]);

  const parsed = Object.fromEntries(PURITIES.map((p) => [p.id, parse(draft[p.id] ?? "")]));
  const invalid = Object.values(parsed).some((v) => v === null);
  const dirty = PURITIES.some((p) => parsed[p.id] !== spreadFor(settings, p.id));

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const { data } = await axios.put<MarginSettings>(MARGINS_WRITE_URL, { spreads: parsed });
      await mutate(data, { revalidate: false });
      toast.success("Spread aggiornati: il calcolatore pubblico usa già i nuovi prezzi.");
    } catch (err) {
      toast.error(apiError(err, "Salvataggio non riuscito"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="margins-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="margins-title" className="font-serif text-3xl font-medium">
            Margini e spread al grammo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sottratto alla quotazione di Borsa del titolo. Ultima modifica:{" "}
            {dayjs(settings.updatedAt).format("DD/MM/YYYY HH:mm")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft(Object.fromEntries(PURITIES.map((p) => [p.id, toInput(spreadFor(DEFAULT_MARGINS, p.id))])))}
            className="inline-flex h-10 items-center gap-2 border border-hairline px-4 text-sm transition-colors hover:bg-muted"
          >
            <RotateCcw className="size-3.5" /> Valori predefiniti
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || invalid || saving}
            className="inline-flex h-10 items-center gap-2 bg-foreground px-5 text-sm font-semibold text-background transition-opacity disabled:opacity-30"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Salva e pubblica
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-hairline bg-paper">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Caratura</th>
              <th className="px-4 py-3 text-right font-medium">Borsa €/g</th>
              <th className="px-4 py-3 text-right font-medium">Spread €/g</th>
              <th className="px-4 py-3 text-right font-medium">Offerta al cliente</th>
              <th className="px-4 py-3 text-right font-medium">% della quotazione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PURITIES.map((p) => {
              const spread = parsed[p.id];
              const spot = spotPerGram(p, gold24k, silver);
              const offer = spread === null ? null : offerPerGram(p, gold24k, silver, spread);
              const ratio = offer && spot.gt(0) ? offer.div(spot).toNumber() : null;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatEur(spot.toNumber())}</td>
                  <td className="px-4 py-3 text-right">
                    <label className="inline-flex items-center gap-1 border-b border-foreground focus-within:border-gold">
                      <span className="text-muted-foreground">−</span>
                      <input
                        inputMode="decimal"
                        aria-label={`Spread ${p.label} in euro al grammo`}
                        aria-invalid={spread === null}
                        value={draft[p.id] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value.replace(/[^\d.,]/g, "") })}
                        className="w-20 bg-transparent py-1 text-right font-medium tabular-nums outline-none aria-[invalid=true]:text-rose-700"
                      />
                      <span className="text-muted-foreground">€</span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{offer ? formatEur(offer.toNumber()) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{ratio !== null ? pct.format(ratio) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(settings.promotions?.seasonal.active || settings.promotions?.heritage.active) && (
        <p className="mt-4 border border-gold/30 bg-gold-soft p-3 text-sm text-gold">
          Promozioni attive dalla sezione Marketing: lo spread mostrato al cliente è ridotto del bonus promozionale.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Salvato in <code>data/margin-settings.json</code>. I voucher già emessi mantengono il prezzo bloccato.
      </p>
    </section>
  );
}
