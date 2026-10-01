import type { Purity } from "@/lib/pricing";

const fmt = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 1 });

/**
 * Quanto metallo puro c'è davvero nell'oggetto: è su questo che si calcola il valore.
 * Es. 10 g di oro 18K (750‰) contengono 7,5 g di oro puro; il resto è lega.
 */
export default function PurityBreakdown({ purity, grams }: { purity: Purity; grams: number | null }) {
  const g = grams ?? 0;
  const fine = g * purity.fineness;
  const alloy = Math.max(g - fine, 0);
  const metal = purity.metal === "gold" ? "oro" : "argento";
  const millesimi = Math.round(purity.fineness * 1000);

  return (
    <figure aria-label={`Composizione: ${fmt.format(fine)} grammi di ${metal} puro su ${fmt.format(g)} grammi`}>
      <figcaption className="flex items-baseline justify-between gap-4 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <span>Metallo puro contenuto</span>
        <span className="normal-case tracking-normal tabular-nums">
          {fmt.format(g)} g × {millesimi}‰
        </span>
      </figcaption>

      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-[2px] bg-muted" aria-hidden>
        <div
          className={purity.metal === "gold" ? "bg-gold" : "bg-[#8a8f98]"}
          style={{ width: `${purity.fineness * 100}%`, transition: "width 500ms var(--ease-out-expo)" }}
        />
        <div
          className="flex-1 border-l-2 border-paper"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--color-hairline) 0 1px, transparent 1px 5px)",
          }}
        />
      </div>

      <div className="mt-2.5 flex justify-between gap-4 text-sm">
        <div>
          <span className="font-semibold tabular-nums text-foreground">{fmt.format(fine)} g</span>{" "}
          <span className="text-muted-foreground">di {metal} puro (999)</span>
        </div>
        <div className="text-right text-muted-foreground">
          <span className="tabular-nums">{fmt.format(alloy)} g</span> di lega · {pct.format(1 - purity.fineness)}
        </div>
      </div>
    </figure>
  );
}
