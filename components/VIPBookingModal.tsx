"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { toast } from "sonner";
import { ArrowLeft, CalendarCheck, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import siteData from "@/data/site-data.json";
import { LOT_TYPES, type DaySlots } from "@/lib/bookings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/cn";

const fetcher = (url: string) => axios.get<DaySlots[]>(url).then((r) => r.data);
const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const eyebrow = "text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground";
const field =
  "h-11 w-full border-b border-hairline bg-transparent text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-gold";

/** Griglia lun–sab delle settimane coperte dalle date prenotabili. */
function weeks(days: DaySlots[]): (DaySlots | { date: string; slots: null })[][] {
  if (!days.length) return [];
  const byDate = new Map(days.map((d) => [d.date, d]));
  const first = dayjs(days[0].date);
  let cursor = first.subtract((first.day() + 6) % 7, "day");
  const last = dayjs(days[days.length - 1].date);
  const out: (DaySlots | { date: string; slots: null })[][] = [];
  while (!cursor.isAfter(last)) {
    const week = Array.from({ length: 6 }, (_, i) => {
      const date = cursor.add(i, "day").format("YYYY-MM-DD");
      return byDate.get(date) ?? { date, slots: null };
    });
    out.push(week);
    cursor = cursor.add(7, "day");
  }
  return out;
}

export default function VIPBookingModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"slot" | "details" | "done">("slot");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    lotType: "" as string,
    estimate: "",
    notes: "",
    privateRoom: true,
    consent: false,
  });
  const [busy, setBusy] = useState(false);

  const { data: days, isLoading, mutate } = useSWR(open ? "/api/bookings/availability" : null, fetcher);
  const grid = useMemo(() => weeks(days ?? []), [days]);
  const selectedDay = days?.find((d) => d.date === date);

  const reset = () => {
    setStep("slot");
    setDate(null);
    setTime(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    setBusy(true);
    try {
      await axios.post("/api/bookings", { ...form, date, time });
      setStep("done");
    } catch (err) {
      const msg = axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined;
      toast.error(msg ?? "Prenotazione non riuscita. Riprova o chiamaci.");
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        await mutate();
        reset();
      }
    } finally {
      setBusy(false);
    }
  };

  const when = date && time ? `${dayjs(date).locale("it").format("dddd D MMMM")} alle ${time}` : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && step === "done") reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-0 rounded-sm p-0 sm:max-w-xl">
        <div className="border-b border-border px-6 py-5 md:px-8">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
              <LockKeyhole className="size-3.5" /> Valutazione riservata
            </div>
            <DialogTitle className="text-2xl font-medium">
              {step === "done" ? "Richiesta ricevuta" : "Prenota un appuntamento privato"}
            </DialogTitle>
            <DialogDescription>
              Ufficio privato in {siteData.address.street}, Bergamo. Per eredità, orologi di pregio e quantitativi
              importanti.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 md:px-8">
          {step === "slot" && (
            <>
              <div className={eyebrow}>1 · Scegli il giorno</div>
              {isLoading || !days ? (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : (
                <div className="mt-3" role="grid" aria-label="Calendario disponibilità">
                  <div className="grid grid-cols-6 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground" role="row">
                    {WEEKDAYS.map((d) => (
                      <div key={d} className="pb-2" role="columnheader">
                        {d}
                      </div>
                    ))}
                  </div>
                  {grid.map((week, i) => (
                    <div key={i} className="grid grid-cols-6 gap-1 pb-1" role="row">
                      {week.map((d) => {
                        const available = d.slots !== null && d.slots.length > 0;
                        const selected = d.date === date;
                        const day = dayjs(d.date);
                        return (
                          <button
                            key={d.date}
                            type="button"
                            role="gridcell"
                            disabled={!available}
                            aria-selected={selected}
                            aria-label={day.locale("it").format("dddd D MMMM")}
                            onClick={() => {
                              setDate(d.date);
                              setTime(null);
                            }}
                            className={cn(
                              "flex h-12 flex-col items-center justify-center border text-sm tabular-nums transition-colors",
                              selected
                                ? "border-foreground bg-foreground text-background"
                                : available
                                  ? "border-hairline hover:border-foreground"
                                  : "border-transparent text-hairline",
                            )}
                          >
                            <span className="font-medium">{day.date()}</span>
                            {day.date() === 1 || (i === 0 && week.indexOf(d) === 0) ? (
                              <span className="text-[9px] uppercase opacity-60">{day.locale("it").format("MMM")}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              <div className={cn(eyebrow, "mt-6")}>2 · Scegli l&apos;orario</div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {selectedDay ? (
                  selectedDay.slots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      aria-pressed={time === t}
                      className={cn(
                        "h-10 border text-sm tabular-nums transition-colors",
                        time === t ? "border-gold bg-gold text-white" : "border-hairline hover:border-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-muted-foreground">Seleziona prima un giorno disponibile.</p>
                )}
              </div>

              <button
                type="button"
                disabled={!date || !time}
                onClick={() => setStep("details")}
                className="mt-8 h-12 w-full bg-foreground text-sm font-semibold uppercase tracking-[0.14em] text-background transition-opacity disabled:opacity-30"
              >
                Continua{when && ` · ${when}`}
              </button>
            </>
          )}

          {step === "details" && (
            <form onSubmit={submit} className="space-y-5">
              <button
                type="button"
                onClick={() => setStep("slot")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> {when}
              </button>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input className={field} placeholder="Nome e cognome" autoComplete="name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input
                  className={field}
                  placeholder="Cellulare"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  pattern="[+\d\s]{6,20}"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^+\d\s]/g, "") })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select value={form.lotType} onValueChange={(v) => setForm({ ...form, lotType: v })} required>
                  <SelectTrigger aria-label="Tipologia del lotto">
                    <SelectValue placeholder="Tipologia del lotto" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input className={field} placeholder="Quantità indicativa (es. 200 g, 3 orologi)" value={form.estimate} onChange={(e) => setForm({ ...form, estimate: e.target.value })} maxLength={80} />
              </div>

              <textarea
                className={cn(field, "h-20 resize-none py-2")}
                placeholder="Note (facoltative)"
                maxLength={500}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <label className="flex cursor-pointer items-start gap-3 border border-hairline bg-muted/60 p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#92400e]"
                  checked={form.privateRoom}
                  onChange={(e) => setForm({ ...form, privateRoom: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="size-4 text-guarantee" /> Massima discrezione
                  </span>
                  <span className="mt-1 block text-muted-foreground">
                    Valutazione a porta chiusa nell&apos;ufficio privato, senza altri clienti presenti. Ti contattiamo
                    solo al numero indicato.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <input type="checkbox" className="mt-0.5 accent-[#92400e]" required checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                Acconsento al trattamento dei dati per gestire questo appuntamento.
              </label>

              <button
                type="submit"
                disabled={busy || !form.lotType}
                className="flex h-12 w-full items-center justify-center gap-2 bg-gold text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_3px_0_0_#5b2808] transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-none disabled:opacity-40"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}
                Richiedi appuntamento
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-sm">
              <p>
                Abbiamo ricevuto la tua richiesta per <strong className="font-semibold">{when}</strong>. Ti
                confermeremo l&apos;appuntamento al numero indicato.
              </p>
              <p className="text-muted-foreground">
                Porta con te un documento d&apos;identità valido e il codice fiscale: sono richiesti per legge per
                ogni acquisto di oro usato.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 w-full border border-foreground text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
