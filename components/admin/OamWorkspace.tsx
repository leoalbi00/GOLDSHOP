"use client";
import { useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { FileDown, FilePlus2, FileText, Loader2, ShieldAlert } from "lucide-react";
import siteData from "@/data/site-data.json";
import { PURITIES, formatEur } from "@/lib/pricing";
import { CASH_LIMIT_EUR, NEAR_LIMIT_RATIO } from "@/lib/compliance-checker";
import type { Voucher } from "@/lib/vouchers";
import { VOUCHERS_KEY, apiError, useVouchers } from "@/lib/useAdminData";
import OAMFormDialog from "@/components/admin/OAMFormDialog";
import ExportData from "@/components/admin/ExportData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });

function WalkInDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (v: Voucher) => void }) {
  const { mutate } = useSWRConfig();
  const [purityId, setPurityId] = useState("18K");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const grams = Number(raw.replace(",", "."));
  const valid = Number.isFinite(grams) && grams > 0;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      const { data } = await axios.post<Voucher>("/api/oam/walk-in", { purityId, grams });
      await mutate(VOUCHERS_KEY);
      onOpenChange(false);
      setRaw("");
      onCreated(data);
    } catch (err) {
      toast.error(apiError(err, "Operazione non creata"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block rounded-sm sm:max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl font-medium">Operazione al banco</DialogTitle>
          <DialogDescription>Cliente senza voucher: imposta metallo e peso, poi compili la scheda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={create} className="mt-5 space-y-4">
          <Select value={purityId} onValueChange={setPurityId}>
            <SelectTrigger aria-label="Caratura"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PURITIES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label} — {p.desc}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Peso netto (g)</span>
            <input inputMode="decimal" required value={raw} onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ""))}
              className="mt-1 h-12 w-full border-b-2 border-hairline bg-transparent text-2xl font-semibold tabular-nums outline-none focus:border-foreground" />
          </label>
          <button type="submit" disabled={!valid || busy} className="flex h-11 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background disabled:opacity-30">
            {busy && <Loader2 className="size-4 animate-spin" />} Continua con la scheda
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function OamWorkspace() {
  const { data: vouchers = [] } = useVouchers();
  const [walkIn, setWalkIn] = useState(false);
  const [oamCode, setOamCode] = useState<string | null>(null);
  const pending = vouchers.filter((v) => v.status === "completed" && !v.oam);
  const done = vouchers.filter((v) => v.oam).slice(0, 12);
  const oamVoucher = vouchers.find((v) => v.code === oamCode) ?? null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium">OAM e registro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schede cliente (D.Lgs. 92/2017), controllo contanti e registro per il commercialista.</p>
        </div>
        <button type="button" onClick={() => setWalkIn(true)} className="inline-flex h-11 items-center gap-2 bg-foreground px-5 text-sm font-semibold text-background">
          <FilePlus2 className="size-4" /> Nuova scheda al banco
        </button>
      </div>

      <div className="mt-6 flex items-start gap-3 border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          <strong className="font-semibold">Antiriciclaggio.</strong> Da {CASH_LIMIT_EUR} € in su solo bonifico o assegno
          (art. 5 D.Lgs. 92/2017): il salvataggio in contanti oltre soglia è bloccato. Da{" "}
          {Math.round(CASH_LIMIT_EUR * NEAR_LIMIT_RATIO)} € in contanti compare un avviso: verificare che l&apos;operazione non sia
          frazionata.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="pending-title">
          <h2 id="pending-title" className="font-serif text-2xl font-medium">Schede da compilare <span className="text-muted-foreground">({pending.length})</span></h2>
          {!pending.length ? (
            <p className="mt-4 border border-dashed border-hairline p-6 text-center text-sm text-muted-foreground">Tutte le operazioni concluse hanno la scheda.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border border-hairline bg-paper">
              {pending.map((v) => (
                <li key={v.code} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 text-sm">
                    <div className="font-mono font-semibold tracking-wider">{v.code}</div>
                    <div className="text-muted-foreground">
                      {v.origin === "banco" ? "Al banco" : "Voucher online"} · {v.purityLabel} · {gramsFmt.format(v.grams)} g · {formatEur(v.amountCents / 100)}
                    </div>
                  </div>
                  <button type="button" onClick={() => setOamCode(v.code)} className="inline-flex h-9 shrink-0 items-center gap-1.5 bg-gold px-3 text-xs font-semibold text-white">
                    <FileText className="size-3.5" /> Compila
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-serif text-2xl font-medium">Ultime schede</h2>
          <ul className="mt-4 divide-y divide-border border border-hairline bg-paper">
            {done.map((v) => (
              <li key={v.code} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold">{v.oam!.lastName} {v.oam!.firstName}</div>
                  <div className="text-muted-foreground">{dayjs(v.oam!.recordedAt).format("DD/MM/YYYY")} · {formatEur(v.oam!.pricePaidCents / 100)} · {v.code}</div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" onClick={() => setOamCode(v.code)} className="h-9 border border-hairline px-3 text-xs hover:bg-muted">Modifica</button>
                  <a href={`/api/generate-oam-pdf?code=${v.code}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 border border-foreground px-3 text-xs font-semibold">
                    <FileDown className="size-3.5" /> PDF
                  </a>
                </div>
              </li>
            ))}
            {!done.length && <li className="p-6 text-center text-sm text-muted-foreground">Nessuna scheda ancora.</li>}
          </ul>
        </section>

        <div className="space-y-6">
          <ExportData vouchers={vouchers} />
          <p className="text-xs text-muted-foreground">
            Ogni scheda va stampata, firmata dal cliente e conservata con copia del documento e foto degli oggetti. I dati restano sul server del
            negozio ({siteData.shortName}).
          </p>
        </div>
      </div>

      <WalkInDialog open={walkIn} onOpenChange={setWalkIn} onCreated={(v) => setOamCode(v.code)} />
      <OAMFormDialog voucher={oamVoucher} onOpenChange={(o) => !o && setOamCode(null)} />
    </>
  );
}
