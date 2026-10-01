"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { TrendingUp } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";

const data = siteData.priceHistory.points.map((p) => ({
  label: dayjs(`${p.month}-01`).locale("it").format("MMM YY"),
  value: p.gold24k,
}));

const first = data[0]?.value ?? 0;
const last = data[data.length - 1]?.value ?? 0;
const changePct = first ? ((last - first) / first) * 100 : 0;

export default function GoldChart() {
  return (
    <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Andamento</span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">
            Il valore dell&apos;oro a Bergamo
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Oro 24K, €/grammo, ultimi {data.length} mesi</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-lg">
          <TrendingUp className="w-5 h-5" />
          {changePct >= 0 ? "+" : ""}
          {changePct.toFixed(1)}%
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={48}
              domain={["dataMin - 2", "dataMax + 2"]}
              tickFormatter={(v: number) => `€${Math.round(v)}`}
            />
            <Tooltip
              contentStyle={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#fcd34d" }}
              formatter={(v) => [`${formatEur(Number(v))}/g`, "Oro 24K"]}
            />
            <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} fill="url(#goldFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
