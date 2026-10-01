"use client";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/it";
import { toast } from "sonner";
import { Check, LockKeyhole, MessageCircle, Phone, X } from "lucide-react";
import siteData from "@/data/site-data.json";
import { telLink, waLink } from "@/lib/whatsapp-engine";
import { apiError, useBookings } from "@/lib/useAdminData";
import type { Booking } from "@/lib/bookings";
import { cn } from "@/lib/cn";

const STATUS: Record<Booking["status"], { label: string; cls: string }> = {
  requested: { label: "Da confermare", cls: "border-amber-700/30 bg-amber-50 text-amber-900" },
  confirmed: { label: "Confermato", cls: "border-guarantee/30 bg-guarantee-soft text-guarantee" },
  cancelled: { label: "Annullato", cls: "border-hairline bg-muted text-muted-foreground" },
};

function confirmMessage(b: Booking) {
  const when = dayjs(b.date).locale("it").format("dddd D MMMM");
  return (
    `Gentile ${b.name}, le confermiamo l'appuntamento riservato di ${when} alle ${b.time} presso ${siteData.name}, ` +
    `${siteData.address.street}, ${siteData.address.city}. Porti con sé un documento d'identità valido e il codice fiscale. ` +
    `Per qualsiasi variazione può rispondere a questo messaggio.`
  );
}

export default function BookingsList() {
  const { data, mutate } = useBookings();
  const today = dayjs().format("YYYY-MM-DD");
  const upcoming = (data ?? []).filter((b) => b.date >= today);

  const setStatus = async (b: Booking, status: "confirmed" | "cancelled") => {
    try {
      await axios.patch(`/api/bookings/${b.id}`, { status });
      await mutate();
      if (status === "cancelled") return void toast.success("Appuntamento annullato");
      // Azione nel toast: il click dell'utente evita il blocco dei popup.
      toast.success("Appuntamento confermato", {
        action: { label: "Avvisa su WhatsApp", onClick: () => window.open(waLink(b.phone, confirmMessage(b)), "_blank", "noopener") },
      });
    } catch (err) {
      toast.error(apiError(err, "Operazione non riuscita"));
    }
  };

  return (
    <section aria-labelledby="bookings-title">
      <h2 id="bookings-title" className="font-serif text-2xl font-medium">
        Appuntamenti riservati
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Richieste dal modulo VIP del sito, dalla più vicina.</p>

      {!upcoming.length ? (
        <p className="mt-6 border border-dashed border-hairline p-8 text-center text-sm text-muted-foreground">
          Nessun appuntamento in programma.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border border-hairline bg-paper">
          {upcoming.map((b) => (
            <li key={b.id} className={cn("grid gap-4 p-4 md:grid-cols-[9rem_1fr_auto] md:items-center", b.status === "cancelled" && "opacity-50")}>
              <div>
                <div className="font-semibold capitalize">{dayjs(b.date).locale("it").format("ddd D MMM")}</div>
                <div className="text-2xl font-medium tabular-nums">{b.time}</div>
              </div>
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{b.name}</span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", STATUS[b.status].cls)}>
                    {STATUS[b.status].label}
                  </span>
                  {b.privateRoom && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gold">
                      <LockKeyhole className="size-3" /> Massima discrezione
                    </span>
                  )}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {b.lotType}
                  {b.estimate && ` · ${b.estimate}`}
                </div>
                {b.notes && <p className="mt-1 text-muted-foreground">“{b.notes}”</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <a href={telLink(b.phone)} className="inline-flex size-9 items-center justify-center border border-hairline hover:bg-muted" aria-label={`Chiama ${b.name}`}>
                  <Phone className="size-3.5" />
                </a>
                <a href={waLink(b.phone, confirmMessage(b))} target="_blank" rel="noopener noreferrer" className="inline-flex size-9 items-center justify-center border border-hairline hover:bg-muted" aria-label={`WhatsApp a ${b.name}`}>
                  <MessageCircle className="size-3.5" />
                </a>
                {b.status === "requested" && (
                  <button type="button" onClick={() => setStatus(b, "confirmed")} className="inline-flex h-9 items-center gap-1.5 bg-guarantee px-3 text-xs font-semibold text-white">
                    <Check className="size-3.5" /> Conferma
                  </button>
                )}
                {b.status !== "cancelled" && (
                  <button type="button" onClick={() => setStatus(b, "cancelled")} className="inline-flex h-9 items-center gap-1.5 border border-hairline px-3 text-xs hover:bg-muted" aria-label="Annulla appuntamento">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
