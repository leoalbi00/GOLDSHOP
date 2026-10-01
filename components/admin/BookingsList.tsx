"use client";
import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { toast } from "sonner";
import { CalendarClock, Check, CheckCheck, LockKeyhole, MessageCircle, Phone, X } from "lucide-react";
import siteData from "@/data/site-data.json";
import { telLink, waLink } from "@/lib/whatsapp-engine";
import { apiError, useBookings } from "@/lib/useAdminData";
import type { Booking, DaySlots } from "@/lib/bookings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/cn";

const STATUS: Record<Booking["status"], { label: string; cls: string }> = {
  requested: { label: "Da confermare", cls: "border-amber-700/30 bg-amber-50 text-amber-900" },
  confirmed: { label: "Confermato", cls: "border-guarantee/30 bg-guarantee-soft text-guarantee" },
  completed: { label: "Completato", cls: "border-foreground/20 bg-foreground text-background" },
  cancelled: { label: "Annullato", cls: "border-hairline bg-muted text-muted-foreground" },
};

const FILTERS = [
  { id: "upcoming", label: "In programma" },
  { id: "past", label: "Passati e chiusi" },
  { id: "all", label: "Tutti" },
] as const;

function confirmMessage(b: Booking) {
  const when = dayjs(b.date).locale("it").format("dddd D MMMM");
  return (
    `Gentile ${b.name}, le confermiamo l'appuntamento riservato di ${when} alle ${b.time} presso ${siteData.name}, ` +
    `${siteData.address.street}, ${siteData.address.city}. Porti con sé un documento d'identità valido e il codice fiscale. ` +
    `Per qualsiasi variazione può rispondere a questo messaggio.`
  );
}

const fetchSlots = (url: string) => axios.get<DaySlots[]>(url).then((r) => r.data);

function RescheduleDialog({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: () => void }) {
  const { data: days } = useSWR(booking ? "/api/bookings/availability" : null, fetchSlots);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const slots = days?.find((d) => d.date === date)?.slots ?? [];

  const save = async () => {
    if (!booking) return;
    setBusy(true);
    try {
      await axios.patch(`/api/bookings/${booking.id}`, { action: "reschedule", date, time });
      toast.success("Appuntamento spostato: ricordati di riconfermarlo al cliente");
      onDone();
      onClose();
    } catch (err) {
      toast.error(apiError(err, "Spostamento non riuscito"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      {booking && (
        <DialogContent className="block rounded-sm sm:max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif text-2xl font-medium">Riprogramma</DialogTitle>
            <DialogDescription>
              {booking.name} · ora {dayjs(booking.date).locale("it").format("ddd D MMM")} alle {booking.time}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-3">
            <Select value={date} onValueChange={(v) => { setDate(v); setTime(""); }}>
              <SelectTrigger aria-label="Nuovo giorno"><SelectValue placeholder="Nuovo giorno" /></SelectTrigger>
              <SelectContent>
                {(days ?? []).map((d) => (
                  <SelectItem key={d.date} value={d.date}>{dayjs(d.date).locale("it").format("dddd D MMMM")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-3 gap-1.5">
              {slots.map((t) => (
                <button key={t} type="button" onClick={() => setTime(t)} aria-pressed={time === t}
                  className={cn("h-10 border text-sm tabular-nums", time === t ? "border-gold bg-gold text-white" : "border-hairline hover:border-foreground")}>
                  {t}
                </button>
              ))}
            </div>
            <button type="button" onClick={save} disabled={!date || !time || busy} className="h-11 w-full bg-foreground text-sm font-semibold text-background disabled:opacity-30">
              Sposta appuntamento
            </button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

type SetStatus = (b: Booking, status: "confirmed" | "completed" | "cancelled", quiet?: boolean) => Promise<void>;

function BookingActions({ b, setStatus, onMove, align = "end" }: { b: Booking; setStatus: SetStatus; onMove: (b: Booking) => void; align?: "end" | "start" }) {
  const setMoving = onMove;
  return (
    <div className={cn("flex flex-wrap gap-1.5", align === "end" ? "justify-end" : "justify-start")}>
      {(b.status === "requested" || b.status === "confirmed") && (
        <a
          href={waLink(b.phone, confirmMessage(b))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => b.status === "requested" && void setStatus(b, "confirmed", true)}
          className="inline-flex h-9 items-center gap-1.5 bg-[#1f9d55] px-3 text-xs font-semibold text-white"
        >
          <MessageCircle className="size-3.5" /> {b.status === "requested" ? "Conferma su WhatsApp" : "Ricorda su WhatsApp"}
        </a>
      )}
      {b.status !== "completed" && b.status !== "cancelled" && (
        <>
          <button type="button" onClick={() => setMoving(b)} className="inline-flex h-9 items-center gap-1.5 border border-hairline px-3 text-xs hover:bg-muted">
            <CalendarClock className="size-3.5" /> Riprogramma
          </button>
          <button type="button" onClick={() => setStatus(b, "completed")} className="inline-flex h-9 items-center gap-1.5 border border-foreground px-3 text-xs font-semibold hover:bg-foreground hover:text-background">
            <CheckCheck className="size-3.5" /> Completato
          </button>
          <button type="button" onClick={() => setStatus(b, "cancelled")} className="inline-flex size-9 items-center justify-center border border-hairline hover:bg-muted" aria-label={`Annulla appuntamento di ${b.name}`}>
            <X className="size-3.5" />
          </button>
        </>
      )}
      <a href={telLink(b.phone)} className="inline-flex size-9 items-center justify-center border border-hairline hover:bg-muted" aria-label={`Chiama ${b.name}`}>
        <Phone className="size-3.5" />
      </a>
      {b.status === "completed" && <Check className="size-4 self-center text-guarantee" aria-hidden />}
    </div>
  );
}

/** Mese a griglia lun–dom: ogni giorno mostra gli appuntamenti; un clic apre il dettaglio con le azioni. */
function BookingsCalendar({ bookings, setStatus, onMove }: { bookings: Booking[]; setStatus: SetStatus; onMove: (b: Booking) => void }) {
  const [month, setMonth] = useState(() => dayjs().startOf("month"));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const start = month.subtract((month.day() + 6) % 7, "day");
  const days = Array.from({ length: 42 }, (_, i) => start.add(i, "day"));
  const byDate = new Map<string, Booking[]>();
  for (const b of bookings) byDate.set(b.date, [...(byDate.get(b.date) ?? []), b].sort((x, y) => x.time.localeCompare(y.time)));
  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setMonth(month.subtract(1, "month"))} className="h-9 border border-hairline px-3 text-sm hover:bg-muted" aria-label="Mese precedente">‹</button>
        <h2 className="font-serif text-2xl font-medium capitalize">{month.locale("it").format("MMMM YYYY")}</h2>
        <button type="button" onClick={() => setMonth(month.add(1, "month"))} className="h-9 border border-hairline px-3 text-sm hover:bg-muted" aria-label="Mese successivo">›</button>
      </div>
      <div className="mt-3 grid grid-cols-7 border-l border-t border-hairline bg-paper text-sm" role="grid" aria-label="Calendario appuntamenti">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d} role="columnheader" className="border-b border-r border-hairline px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
        ))}
        {days.map((d) => {
          const key = d.format("YYYY-MM-DD");
          const list = byDate.get(key) ?? [];
          return (
            <div key={key} role="gridcell" className={cn("min-h-24 border-b border-r border-hairline p-1.5", d.month() !== month.month() && "bg-muted/50 text-muted-foreground")}>
              <div className={cn("mb-1 inline-flex size-6 items-center justify-center text-xs tabular-nums", key === today && "rounded-full bg-foreground text-background")}>{d.date()}</div>
              <div className="space-y-1">
                {list.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className={cn("block w-full truncate border px-1.5 py-0.5 text-left text-[11px] font-medium", STATUS[b.status].cls, selectedId === b.id && "ring-2 ring-gold")}
                  >
                    {b.time} {b.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border border-hairline bg-paper p-4 text-sm">
          <div>
            <div className="font-semibold">
              {dayjs(selected.date).locale("it").format("dddd D MMMM")} · {selected.time} — {selected.name}
            </div>
            <div className="text-muted-foreground">
              {selected.lotType}
              {selected.estimate && ` · ${selected.estimate}`} · {selected.phone}
            </div>
          </div>
          <BookingActions b={selected} setStatus={setStatus} onMove={onMove} align="start" />
        </div>
      )}
    </div>
  );
}

export default function BookingsList() {
  const { data, mutate } = useBookings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("upcoming");
  const [moving, setMoving] = useState<Booking | null>(null);
  const [view, setView] = useState<"table" | "calendar">("table");
  const today = dayjs().format("YYYY-MM-DD");
  const open = (b: Booking) => b.date >= today && (b.status === "requested" || b.status === "confirmed");
  const list = (data ?? []).filter((b) => (filter === "all" ? true : filter === "upcoming" ? open(b) : !open(b)));

  const setStatus = async (b: Booking, status: "confirmed" | "completed" | "cancelled", quiet = false) => {
    try {
      await axios.patch(`/api/bookings/${b.id}`, { action: "status", status });
      await mutate();
      if (!quiet) toast.success(STATUS[status].label);
    } catch (err) {
      toast.error(apiError(err, "Operazione non riuscita"));
    }
  };

  return (
    <section aria-labelledby="bookings-title">
      <h1 id="bookings-title" className="font-serif text-3xl font-medium">Prenotazioni VIP</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Appuntamenti riservati per lotti importanti ed eredità in {siteData.address.street}.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {view === "table" && FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
              className={cn("h-8 border px-3 text-xs font-medium", filter === f.id ? "border-foreground bg-foreground text-background" : "border-hairline hover:bg-muted")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex border border-hairline" role="tablist" aria-label="Vista">
          {(["table", "calendar"] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={cn("h-8 px-3 text-xs font-medium", view === v ? "bg-foreground text-background" : "hover:bg-muted")}>
              {v === "table" ? "Tabella" : "Calendario"}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" ? (
        <BookingsCalendar bookings={(data ?? []).filter((b) => b.status !== "cancelled")} setStatus={setStatus} onMove={setMoving} />
      ) : !list.length ? (
        <p className="mt-6 border border-dashed border-hairline p-8 text-center text-sm text-muted-foreground">Nessun appuntamento in questa vista.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-hairline bg-paper">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Lotto</th>
                <th className="px-4 py-3 font-medium">Stato</th>
                <th className="px-4 py-3 text-right font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((b) => (
                <tr key={b.id} className={cn(b.status === "cancelled" && "opacity-50")}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold capitalize">{dayjs(b.date).locale("it").format("ddd D MMM")}</div>
                    <div className="text-xl font-medium tabular-nums">{b.time}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold">{b.name}</div>
                    <div className="tabular-nums text-muted-foreground">{b.phone}</div>
                    {b.privateRoom && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gold"><LockKeyhole className="size-3" /> Massima discrezione</div>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top">
                    <div>{b.lotType}</div>
                    {b.estimate && <div className="text-muted-foreground">{b.estimate}</div>}
                    {b.notes && <div className="mt-1 text-muted-foreground">“{b.notes}”</div>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", STATUS[b.status].cls)}>
                      {STATUS[b.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <BookingActions b={b} setStatus={setStatus} onMove={setMoving} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <RescheduleDialog booking={moving} onClose={() => setMoving(null)} onDone={() => void mutate()} />
    </section>
  );
}
