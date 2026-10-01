"use client";
import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { TrendingDown, TrendingUp } from "lucide-react";
import { TIMEFRAMES, type HistoryPayload, type Timeframe } from "@/lib/history";
import { formatEur } from "@/lib/pricing";
import { cn } from "@/lib/cn";

const fetcher = (url: string) => axios.get<HistoryPayload>(url).then((r) => r.data);

export default function GoldChartSection() {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const { data, isLoading } = useSWR(`/api/history?range=${timeframe}`, fetcher, { keepPreviousData: true });

  const points = (data?.points ?? []).map((p) => ({
    ...p,
    label: dayjs(p.date).locale("it").format(timeframe === "1y" ? "MMM YY" : "D MMM"),
  }));
  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  const changePct = first ? ((last - first) / first) * 100 : 0;
  const up = changePct >= 0;

  return (
    <motion.section
      id="andamento"
      className="scroll-mt-24 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-10"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Andamento</span>
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mt-1">Il prezzo dell&apos;oro a Bergamo</h2>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-zinc-500">Oro 24K, €/g</span>
            <span className={cn("flex items-center gap-1 font-mono font-bold", up ? "text-emerald-400" : "text-rose-400")}>
              {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {up ? "+" : ""}
              {changePct.toFixed(2)}%
            </span>
            {data?.source === "demo" && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                Dati dimostrativi
              </span>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="Periodo" className="inline-flex rounded-xl border border-zinc-800 bg-black p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={timeframe === t.id}
              onClick={() => setTimeframe(t.id)}
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                timeframe === t.id ? "text-black" : "text-zinc-400 hover:text-white",
              )}
            >
              {timeframe === t.id && (
                <motion.span
                  layoutId="tf-pill"
                  className="absolute inset-0 rounded-lg bg-amber-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("h-80 w-full transition-opacity", isLoading && "opacity-50")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
            <YAxis
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => `€${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#fcd34d" }}
              formatter={(v) => [`${formatEur(Number(v))}/g`, "Oro 24K"]}
              cursor={{ stroke: "#f59e0b", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#goldFill)"
              activeDot={{ r: 5, fill: "#fcd34d", stroke: "#000" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-xs text-zinc-600">Ultimo valore: {formatEur(last)}/g</p>
    </motion.section>
  );
}
