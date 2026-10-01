"use client";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { useQuotes } from "@/lib/useQuotes";
import { formatEur } from "@/lib/pricing";
import { cn } from "@/lib/cn";

const SHOWN = ["24K", "18K", "14K", "AG"];

export default function LiveTicker() {
  const { quotes, updatedAt, source } = useQuotes();
  const rows = SHOWN.map((id) => quotes.find((q) => q.id === id)).filter((q) => q !== undefined);

  return (
    <div className="border-b border-border bg-muted text-xs">
      <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-2 sm:px-6">
        <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", source === "feed" ? "bg-guarantee" : "bg-slate-400")} />
          <span className="font-medium uppercase tracking-wider">
            {source === "feed" ? "Quotazioni live" : "Quotazioni indicative"}
          </span>
          <span className="hidden sm:inline">· {dayjs(updatedAt).locale("it").format("D MMM YYYY")}</span>
        </div>

        <dl className="flex shrink-0 items-center divide-x divide-border">
          {rows.map((q) => {
            const up = q.changePct >= 0;
            return (
              <div key={q.id} className="flex items-baseline gap-2 px-4 first:pl-0">
                <dt className="text-muted-foreground">{q.label}</dt>
                <dd className="font-semibold tabular-nums text-foreground">{formatEur(q.eurPerGram)}/g</dd>
                <dd className={cn("tabular-nums font-medium", up ? "text-guarantee" : "text-rose-600")}>
                  {up ? "▲" : "▼"} {up ? "+" : ""}
                  {q.changePct.toFixed(2)}%
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
