"use client";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { useQuotes } from "@/lib/useQuotes";
import { formatEur } from "@/lib/pricing";

export default function LiveTicker() {
  const { quotes, updatedAt, source } = useQuotes();
  // Duplichiamo la lista per uno scorrimento continuo senza salti.
  const loop = [...quotes, ...quotes];

  return (
    <div className="bg-black border-b border-amber-500/20 text-zinc-300 text-xs select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-2">
        <div className="flex items-center gap-2 shrink-0 text-amber-400 font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {source === "feed" ? "Quotazioni live" : "Quotazioni indicative"} ·{" "}
            {dayjs(updatedAt).locale("it").format("D MMM YYYY")}
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
          <motion.div
            className="flex w-max gap-10"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          >
            {loop.map((q, i) => (
              <div key={`${q.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-zinc-500 uppercase tracking-wider">{q.label}</span>
                <span className="font-mono font-bold text-amber-200">{formatEur(q.eurPerGram)}/g</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
