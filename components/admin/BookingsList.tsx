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

export default function BookingsList() {
  const { data, mutate } = useBookings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("upcoming");
  const [moving, setMoving] = useState<Booking | null>(null);
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

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
            className={cn("h-8 border px-3 text-xs font-medium", filter === f.id ? "border-foreground bg-foreground text-background" : "border-hairline hover:bg-muted")}>
            {f.label}
          </button>
        ))}
      </div>

      {!list.length ? (
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
                    <div className="flex flex-wrap justify-end gap-1.5">
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
