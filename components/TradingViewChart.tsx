"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useQuotes } from "@/lib/useQuotes";
import { TIMEFRAMES, goldHistory, type PricePoint, type Timeframe } from "@/lib/goldHistory";
import { cn } from "@/lib/cn";

const TZ = "Europe/Rome";
const LINE = "#047857";
const INK = "#6b6760";
const GRID = "rgba(17, 24, 39, 0.05)";
const HAIRLINE = "#d9d4c8";

const priceFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const pctFmt = new Intl.NumberFormat("it-IT", { signDisplay: "always", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fullTime = new Intl.DateTimeFormat("it-IT", {
  timeZone: TZ,
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dayOnly = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const hourTick = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayTick = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, day: "numeric", month: "short" });
const monthTick = new Intl.DateTimeFormat("it-IT", { timeZone: TZ, month: "short" });

const toDate = (t: Time) => new Date((t as UTCTimestamp) * 1000);

export default function TradingViewChart({ className }: { className?: string }) {
  const { gold24k, prev, updatedAt, source } = useQuotes();
  const [tf, setTf] = useState<Timeframe>("30D");
  const [hover, setHover] = useState<PricePoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const tfRef = useRef(tf);
  tfRef.current = tf;

  const data = useMemo(() => goldHistory(tf, gold24k, prev.gold24k, updatedAt), [tf, gold24k, prev.gold24k, updatedAt]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: INK,
        fontFamily: getComputedStyle(document.body).fontFamily,
        fontSize: 11,
        attributionLogo: true,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: GRID } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.18, bottom: 0.08 } },
      timeScale: {
        borderColor: HAIRLINE,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (t: Time) => {
          const d = toDate(t);
          if (tfRef.current === "24H") return hourTick.format(d);
          if (tfRef.current === "1Y") return monthTick.format(d);
          return dayTick.format(d);
        },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: "#111827", width: 1, style: LineStyle.Solid, labelBackgroundColor: "#111827" },
        horzLine: { color: HAIRLINE, width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#111827" },
      },
      localization: {
        locale: "it-IT",
        priceFormatter: (p: number) => priceFmt.format(p),
        timeFormatter: (t: Time) => (tfRef.current === "1Y" ? dayOnly : fullTime).format(toDate(t)),
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: LINE,
      lineWidth: 2,
      topColor: "rgba(4, 120, 87, 0.22)",
      bottomColor: "rgba(4, 120, 87, 0)",
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#faf9f6",
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBackgroundColor: LINE,
    });

    const onMove = (param: MouseEventParams) => {
      const point = param.seriesData.get(series) as { value?: number } | undefined;
      setHover(param.time && point?.value !== undefined ? { time: param.time as UTCTimestamp, value: point.value } : null);
    };
    chart.subscribeCrosshairMove(onMove);

    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  const first = data[0]?.value ?? gold24k;
  const last = data[data.length - 1]?.value ?? gold24k;
  const shown = hover ?? data[data.length - 1];
  const changePct = ((last - first) / first) * 100;
  const up = changePct >= 0;

  return (
    <figure className={cn("flex flex-col", className)} aria-label="Andamento prezzo oro 24K in euro al grammo">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <figcaption className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Oro 24K · €/grammo
          </figcaption>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-medium tracking-tight tabular-nums text-foreground md:text-5xl">
              {priceFmt.format(shown?.value ?? gold24k)}
            </span>
            {!hover && (
              <span className={cn("text-sm font-medium tabular-nums", up ? "text-guarantee" : "text-rose-700")}>
                {pctFmt.format(changePct)}%
                <span className="ml-1 font-normal text-muted-foreground">
                  {TIMEFRAMES.find((t) => t.id === tf)?.label}
                </span>
              </span>
            )}
          </div>
          <div className="mt-1 h-4 text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {shown && (tf === "1Y" ? dayOnly : fullTime).format(toDate(shown.time))} · ora di Roma
          </div>
        </div>

        <TabsPrimitive.Root value={tf} onValueChange={(v) => setTf(v as Timeframe)}>
          <TabsPrimitive.List aria-label="Intervallo temporale" className="flex border-b border-hairline">
            {TIMEFRAMES.map((t) => (
              <TabsPrimitive.Trigger
                key={t.id}
                value={t.id}
                className="relative -mb-px min-w-12 px-3 pb-2 text-xs font-semibold tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 data-[state=active]:text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground"
              >
                {t.label}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </TabsPrimitive.Root>
      </div>

      <div ref={containerRef} className="mt-6 h-[320px] w-full md:h-[380px]" />

      <p className="mt-3 text-[11px] text-muted-foreground">
        {source === "feed"
          ? "Quotazione di mercato, aggiornata ogni minuto."
          : "Serie indicativa ricostruita sulla quotazione di riferimento: non costituisce quotazione ufficiale."}
      </p>
    </figure>
  );
}
