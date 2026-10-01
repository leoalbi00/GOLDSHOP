"use client";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { toast } from "sonner";
import { FileSpreadsheet, FileText } from "lucide-react";
import { PAYMENT_LABEL, voucherState, type Voucher } from "@/lib/vouchers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATE_LABEL = { active: "Attivo", expired: "Scaduto", completed: "Completato" } as const;
const eur = (cents: number | undefined) => (cents === undefined ? null : Math.round(cents) / 100);

/** Una riga per operazione, con colonne pensate per il commercialista. */
function rows(list: Voucher[]) {
  return list.map((v) => ({
    Data: dayjs(v.completedAt ?? v.createdAt).format("DD/MM/YYYY"),
    Ora: dayjs(v.completedAt ?? v.createdAt).format("HH:mm"),
    Codice: v.code,
    Stato: STATE_LABEL[voucherState(v)],
    Metallo: v.metal === "gold" ? "Oro" : "Argento",
    Caratura: v.purityLabel,
    "Grammi bloccati": v.grams,
    "Importo bloccato €": eur(v.amountCents),
    "Spread €/g": v.spreadPerGram,
    "Margine stimato €": eur(v.marginCents),
    Cliente: v.oam ? `${v.oam.lastName} ${v.oam.firstName}` : (v.contact?.name ?? ""),
    "Codice fiscale": v.oam?.taxCode ?? "",
    Documento: v.oam ? `${v.oam.docType} ${v.oam.docNumber}` : "",
    "Descrizione oggetti": v.oam?.itemsDescription ?? "",
    "Peso lordo g": v.oam?.grossWeight ?? null,
    "Peso netto g": v.oam?.netWeight ?? null,
    "Prezzo corrisposto €": eur(v.oam?.pricePaidCents),
    Pagamento: v.oam ? PAYMENT_LABEL[v.oam.paymentMethod] : "",
    "Rif. pagamento": v.oam?.paymentReference ?? "",
  }));
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportData({ vouchers }: { vouchers: Voucher[] }) {
  const months = useMemo(() => {
    const set = new Set(vouchers.map((v) => dayjs(v.completedAt ?? v.createdAt).format("YYYY-MM")));
    set.add(dayjs().format("YYYY-MM"));
    return [...set].sort().reverse();
  }, [vouchers]);
  const [month, setMonth] = useState(months[0]);
  const [onlyCompleted, setOnlyCompleted] = useState(true);

  const selected = vouchers
    .filter((v) => dayjs(v.completedAt ?? v.createdAt).format("YYYY-MM") === month)
    .filter((v) => !onlyCompleted || v.status === "completed")
    .sort((a, b) => (a.completedAt ?? a.createdAt).localeCompare(b.completedAt ?? b.createdAt));
  const base = `registro-compro-oro-${month}`;

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const data = rows(selected);
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, dayjs(`${month}-01`).locale("it").format("MMMM YYYY"));
    XLSX.writeFile(wb, `${base}.xlsx`);
    toast.success(`${selected.length} operazioni esportate in Excel`);
  };

  const exportCsv = async () => {
    const Papa = (await import("papaparse")).default;
    // Punto e virgola e BOM: Excel in italiano apre il file con colonne e accenti corretti.
    const csv = Papa.unparse(rows(selected), { delimiter: ";" });
    download(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
    toast.success(`${selected.length} operazioni esportate in CSV`);
  };

  return (
    <section aria-labelledby="export-title" className="border border-hairline bg-paper p-6">
      <h2 id="export-title" className="font-serif text-2xl font-medium">
        Registro per il commercialista
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Esporta le operazioni del mese in Excel o CSV.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger aria-label="Mese">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {dayjs(`${m}-01`).locale("it").format("MMMM YYYY")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[#92400e]" checked={onlyCompleted} onChange={(e) => setOnlyCompleted(e.target.checked)} />
          Solo concluse
        </label>
      </div>

      <p className="mt-4 text-sm">
        <span className="font-semibold tabular-nums">{selected.length}</span>{" "}
        <span className="text-muted-foreground">operazioni nel periodo</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={exportXlsx} disabled={!selected.length} className="inline-flex h-11 items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background disabled:opacity-30">
          <FileSpreadsheet className="size-4" /> Excel
        </button>
        <button type="button" onClick={exportCsv} disabled={!selected.length} className="inline-flex h-11 items-center justify-center gap-2 border border-foreground text-sm font-semibold disabled:opacity-30">
          <FileText className="size-4" /> CSV
        </button>
      </div>
    </section>
  );
}
