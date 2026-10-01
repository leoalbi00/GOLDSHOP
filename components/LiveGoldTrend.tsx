"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useQuotes } from "@/lib/useQuotes";
import { PURITIES, formatEur } from "@/lib/pricing";
import { TIMEFRAMES, goldHistory, type Timeframe } from "@/lib/goldHistory";
import { cn } from "@/lib/cn";

const C24 = "#047857";
const C18 = "#92400e";
const FINE_18K = PURITIES.find((p) => p.id === "18K")!.fineness;
const TZ = "Europe/Rome";
const pct = new Intl.NumberFormat("it-IT", { signDisplay: "always", minimumFractionDigits: 1, maximumFractionDigits: 2 });
const when = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const day = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, day: "numeric", month: "short" });
const hour = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const toDate = (t: Time) => new Date((t as UTCTimestamp) * 1000);

/**
 * Andamento oro 24K e 18K (€/g, stesso asse). Il badge usa solo dati reali:
 * con quotazioni di riferimento la variazione da ieri; con un feed di mercato la variazione del periodo.
 */
export default function LiveGoldTrend() {
  const { gold24k, prev, updatedAt, source, quotes } = useQuotes();
  const [tf, setTf] = useState<Timeframe>("30D");
  const [hover, setHover] = useState<{ time: Time; v24: number; v18: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const s24 = useRef<ISeriesApi<"Area"> | null>(null);
  const s18 = useRef<ISeriesApi<"Line"> | null>(null);
  const tfRef = useRef(tf);
  tfRef.current = tf;

  const data = useMemo(() => goldHistory(tf, gold24k, prev.gold24k, updatedAt), [tf, gold24k, prev.gold24k, updatedAt]);

  useEffect(() => {
    if (!box.current) return;
    const c = createChart(box.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#6b6760", fontFamily: getComputedStyle(document.body).fontFamily, fontSize: 11 },
      grid: { vertLines: { visible: false }, horzLines: { color: "rgba(17,24,39,0.05)" } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: {
        borderColor: "#d9d4c8",
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (t: Time) => (tfRef.current === "24H" ? hour : day).format(toDate(t)),
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: "#111827", width: 1, style: LineStyle.Solid, labelBackgroundColor: "#111827" },
        horzLine: { visible: false, labelVisible: false },
      },
      localization: { locale: "it-IT", priceFormatter: (p: number) => formatEur(p), timeFormatter: (t: Time) => when.format(toDate(t)) },
      handleScroll: false,
      handleScale: false,
    });
    const a = c.addSeries(AreaSeries, {
      lineColor: C24,
      lineWidth: 2,
      topColor: "rgba(4,120,87,0.18)",
      bottomColor: "rgba(4,120,87,0)",
      priceLineVisible: false,
      crosshairMarkerBorderColor: "#ffffff",
      crosshairMarkerBorderWidth: 2,
    });
    const l = c.addSeries(LineSeries, {
      color: C18,
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerBorderColor: "#ffffff",
      crosshairMarkerBorderWidth: 2,
    });
    const onMove = (p: MouseEventParams) => {
      const d24 = p.seriesData.get(a) as { value?: number } | undefined;
      const d18 = p.seriesData.get(l) as { value?: number } | undefined;
      setHover(p.time && d24?.value !== undefined && d18?.value !== undefined ? { time: p.time, v24: d24.value, v18: d18.value } : null);
    };
    c.subscribeCrosshairMove(onMove);
    chart.current = c;
    s24.current = a;
    s18.current = l;
    return () => {
      c.unsubscribeCrosshairMove(onMove);
      c.remove();
    };
  }, []);

  useEffect(() => {
    s24.current?.setData(data);
    s18.current?.setData(data.map((d) => ({ time: d.time, value: Math.round(d.value * FINE_18K * 100) / 100 })));
    chart.current?.timeScale().fitContent();
  }, [data]);

  const last = data[data.length - 1]?.value ?? gold24k;
  const periodChange = data.length ? ((last - data[0].value) / data[0].value) * 100 : 0;
  const atHigh = data.length > 0 && last >= Math.max(...data.map((d) => d.value));
  // Il periodo è affidabile solo con un feed di mercato; altrimenti si usa la variazione reale da ieri.
  const change = source === "feed" ? periodChange : (quotes.find((q) => q.id === "24K")?.changePct ?? 0);
  const changeLabel = source === "feed" ? `${TIMEFRAMES.find((t) => t.id === tf)?.label}` : "da ieri";
  const up = change > 0;

  const v24 = hover?.v24 ?? last;
  const v18 = hover?.v18 ?? last * FINE_18K;

  return (
    <div className="border border-hairline bg-paper p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
            up ? "border-guarantee/30 bg-guarantee-soft text-guarantee" : "border-hairline bg-muted text-foreground",
          )}
        >
          {up ? "📈" : "📊"}{" "}
          {up
            ? `Quotazione ${source === "feed" && atHigh ? "ai massimi" : "in rialzo"} (${pct.format(change)}% ${changeLabel}) — Momento favorevole per vendere`
            : `Quotazione ${pct.format(change)}% ${changeLabel}`}
        </div>

        <div className="flex border-b border-hairline" role="tablist" aria-label="Periodo">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tf === t.id}
              onClick={() => setTf(t.id)}
              className={cn(
                "relative -mb-px px-3 pb-2 text-xs font-semibold tracking-wider transition-colors",
                tf === t.id ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-0.5 w-4 rounded-full" style={{ background: C24 }} /> Oro 24K
          </dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums">{formatEur(v24)}<span className="text-base font-normal text-muted-foreground">/g</span></dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-0.5 w-4 rounded-full" style={{ background: C18 }} /> Oro 18K
          </dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums">{formatEur(v18)}<span className="text-base font-normal text-muted-foreground">/g</span></dd>
        </div>
        <div className="self-end pb-1 text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {hover ? when.format(toDate(hover.time)) : "Ultima quotazione"} · ora di Roma
        </div>
      </dl>

      <div ref={box} className="mt-4 h-[280px] w-full sm:h-[340px]" aria-label="Grafico andamento oro 24K e 18K in euro al grammo" role="img" />

      <p className="mt-3 text-[11px] text-muted-foreground">
        {source === "feed"
          ? "Quotazioni di mercato, aggiornate ogni minuto. Prezzi di Borsa prima del margine del negozio."
          : "Ultima quotazione e variazione da ieri reali; l'andamento storico è una serie indicativa. Prezzi di Borsa prima del margine del negozio."}
      </p>
    </div>
  );
}
